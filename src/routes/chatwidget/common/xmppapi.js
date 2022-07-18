import _ from 'lodash';
import { Strophe, $build, $msg, $iq, $pres, b64_sha1 }  from 'strophe.js'
import Sizzle from 'sizzle';
import { UserStatus } from './common';

var XmppApiSingleton = (function () {
    var instance;

    function createInstance() {
        var object = new XmppApi();
        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

class XmppApi {
    constructor() {
        // this.back_url = null;
        this.back_domain = null;
        this.connection = null;
        this.jid = null;
        this.pass = null;
        this.connection_status = Strophe.Status.DISCONNECTED;
        this.user_status = 'unavailable'//UserStatus.UNAVAILABLE;
        this.ver_string = {};
        this.sizzle = Sizzle;
        this.websocket_url = [];
        this.bosh_url = [];

        //storage of server disco items
        this.disco_items = null;

        //callbacks
        this.status_update_callback = null;
        this.user_presence_update_callback = null;
        this.user_message_update_callback = null;
        this.iq_message_callback = null;

        //caps
        this.addCaps();



        //connect on creation
        //this.connect()

        //events
        // this.status_update_event = new Event('status_update');
        // this.user_presence_update = new CustomEvent('user_presence_update', {
        //     detail: {
        //         user_from: null,
        //         user_to: null,
        //         status: null,
        //         group: null
        //     }
        // })
        // this.user_message_update = new CustomEvent('user_message_update', {
        //     detail: {
        //         msg_id: null,
        //         user_from: null,
        //         user_to: null,
        //         message: null,
        //         event: null,
        //         type: null,
        //         group_nick: null,
        //         stamp: null,
        //         mam: null
        //     }
        // })


        //binds
        this.onConnect = this.onConnect.bind(this);
        this.onPresenceHandler = this.onPresenceHandler.bind(this);
        this.onMessageHandler = this.onMessageHandler.bind(this);
        this.onIqHandler = this.onIqHandler.bind(this);
        this.addVerString = this.addVerString.bind(this);
        this.onStatusUpdate = this.onStatusUpdate.bind(this);
        this.onUserMessageUpdate = this.onUserMessageUpdate.bind(this);
        this.onUserPresenceUpdate = this.onUserPresenceUpdate.bind(this);
        this.ConnectedOrWait = this.ConnectedOrWait.bind(this);

    }

    async ConnectedOrWait() {
        let promise = new Promise((resolve, reject) => {
            if (this.connection && this.connection_status == Strophe.Status.CONNECTED) {
                resolve(this)
            } else {
                this.connect()
                    .then(x => x.login())
                    .then(x => {
                        resolve(this)
                    }).catch(e => reject(e));
            }
        })

        return await promise
    }

    async discoverServices() {
        //discover connection methods
        let url = `https://${this.back_domain}/.well-known/host-meta.json`;
        const options = {
            mode: 'cors',
            headers: {
                'Accept': 'application/json;charset=utf-8'
            },
            redirect: "follow",
            referrerPolicy: "origin-when-cross-origin"
        };
        try {
            let response = await fetch(url, options);
            let body = await response.json()
            body.links.forEach(l => {
                if (l.rel == 'urn:xmpp:alt-connections:xbosh') {
                    this.bosh_url.push(l.href);
                }
                if (l.rel == 'urn:xmpp:alt-connections:websocket') {
                    this.websocket_url.push(l.href);
                }
            });
        } catch (e) {
            console.error("Couldn't find valid connection method");
            return
        }



    }

    getUniqueId() {
        return Math.random().toString().substring(2);
    }

    addCaps() {

        Strophe.addNamespace("CAPS", "http://jabber.org/protocol/caps");
        Strophe.addNamespace("PUBSUB", "http://jabber.org/protocol/pubsub#event");
        Strophe.addNamespace("CHATSTATES", "http://jabber.org/protocol/chatstates");
        Strophe.addNamespace("MAM", "urn:xmpp:mam:2");
        Strophe.addNamespace("FORWARDED", "urn:xmpp:forward:0");
        Strophe.addNamespace("DELAY", "urn:xmpp:delay");
        Strophe.addNamespace("JABBER_CLIENT", "jabber:client");
        Strophe.addNamespace("RSM", "http://jabber.org/protocol/rsm");
        Strophe.addNamespace("DISCO_ITEMS", "http://jabber.org/protocol/disco#items");
        Strophe.addNamespace("DISCO_INFO", "http://jabber.org/protocol/disco#info");
        Strophe.addNamespace("JABBER_DATA", "jabber:x:data");
        Strophe.addNamespace("HTTP_FILE_UPLOAD", "urn:xmpp:http:upload:0");
        Strophe.addNamespace("OOB", "jabber:x:oob");

        let hash = 'sha-1'
        let node = 'http://305crm.com';
        this.identity = [
            {
                category: 'client',
                type: 'pc',
                name: 'crm305chat'
            }
        ];

        this.caps = [
            'http://jabber.org/protocol/caps',
            'http://jabber.org/protocol/disco#info',
            'http://jabber.org/protocol/chatstates',
            'http://jabber.org/protocol/amp?condition=deliver',
            'http://jabber.org/protocol/amp?condition=notify'
        ];

        let S = this.identity.reduce((result, id) => `${result}${id.category}/${id.type}/${id?.lang ?? ''}/${id.name}<`, "");
        S = this.caps.reduce((result, cap) => `${result}${cap}<`, S);
        S = b64_sha1(S);

        this.caps_node = $build('c', {
            xmlns: Strophe.NS.CAPS,
            node: node,
            hash: hash,
            ver: S
        }).nodeTree;
    }

    onIqMessage(method) {
        this.iq_message_callback = method
        // document.addEventListener('status_update', method);
    }

    onStatusUpdate(method) {
        this.status_update_callback = method
        // document.addEventListener('status_update', method);
    }

    onUserPresenceUpdate(method) {
        this.user_presence_update_callback = method
        // document.addEventListener('user_presence_update', method);
    }

    onUserMessageUpdate(method) {
        this.user_message_update_callback = method
        // document.addEventListener('user_message_update', method);
    }

    removeStatusUpdate() {
        this.status_update_callback = null
        // document.removeEventListener('status_update', method);
    }

    removeUserPresenceUpdate() {
        this.user_presence_update_callback = null
        // document.removeEventListener('user_presence_update', method);
    }

    removeUserMessageUpdate() {
        this.user_message_update_callback = null
        // document.removeEventListener('user_message_update', method);
    }

    removeIqMessage() {
        this.iq_message_callback = null
        // document.addEventListener('status_update', method);
    }

    // setUrl(back_url) {
    //     this.back_url = back_url;
    // }

    async setDomain(domain) {
        this.back_domain = domain;
        await this.discoverServices();
    }

    addVerString(ver_string, jid) {
        if (!Object.hasOwn(this.ver_string, ver_string)) {
            this.ver_string[ver_string] = [];
            this.sendQueryCaps(jid);
        }
    }

    async sendQueryCaps(jid) {
        console.debug(`Query caps for ${jid}`);
    }

    async connect(domain = null) {
        if (domain) {
            await this.setDomain(domain)
        }

        let url = null
        if (this.websocket_url.length > 0) {   //TODO: iterate over connections on error
            url = this.websocket_url[0];
        } else if (this.bosh_url.length > 0) {
            url = this.bosh_url[0];
        }
        if (url) {
            this.connection = new Strophe.Connection(url)
            this.connection.addHandler(this.onIqHandler, null, 'iq');
            this.connection.addHandler(this.onPresenceHandler, null, 'presence');
            this.connection.addHandler(this.onMessageHandler, null, 'message');
            Strophe.Connection.xmlOutput = function (elem) {
                console.debug(elem)
            };
        } else {
            throw `No websocket or Bosh url found for domain "${this.back_domain}"`
        }
        return this;
    }

    onIqHandler(iq) {
        console.debug(iq)

        return true;
    }

    onPresenceHandler(presence) {
        this.processPresenceHandler(presence);
        return true;
    }

    async processPresenceHandler(presence) {
        console.debug(presence);
        let full_jid_from = presence.hasAttribute('from') ? presence.getAttribute('from') : null;
        let full_jid_to = presence.hasAttribute('to') ? presence.getAttribute('to') : null;
        let unavailable = presence.hasAttribute('type') && presence.getAttribute('type') == 'unavailable';
        let status = null;
        if (unavailable) {
            status = 'unavailable'
        } else {
            let show_tag = presence.getElementsByTagName('show');
            status = show_tag.length == 1 ? show_tag[0].textContent : null;
            if (status == null) {
                status = 'available'
            }
        }

        let c_nodes = presence.getElementsByTagName('c');
        for (let i = 0; i < c_nodes.length; i++) {
            let c = c_nodes[i];
            if (c.hasAttribute('xmlns') && c.getAttribute('xmlns') == 'http://jabber.org/protocol/caps') { //receiving caps
                if (c.hasAttribute('hash')) {
                    let ver = c.getAttribute('ver');
                    this.addVerString(ver, full_jid_from)
                }
            }
        }

        let x_nodes = presence.getElementsByTagName('x');
        for (let i = 0; i < x_nodes.length; i++) {
            let x = x_nodes[i];
            if (x.getAttribute('xmlns') == 'http://jabber.org/protocol/muc#user') {
                //this is a presence from group chat. do nothing for now
                //in the future, show user connected with photos
                return true;
            }
        }
        let data = {
            user_from: full_jid_from,
            user_to: full_jid_to,
            status: status
        }

        if (this.user_presence_update_callback) {
            this.user_presence_update_callback(data)
        }
    }

    async queryHistoryFrom(jid, /*start = null, end = null,*/ before = null, group = false, count = 10) {
        return this.ConnectedOrWait().then(x => {
            try {
                let unique_id = this.getUniqueId()

                let q = null;

                if (!group) {
                    q = $iq({
                        type: 'set',
                        id: unique_id
                    }).c('query', {
                        xmlns: 'urn:xmpp:mam:2',
                    });
                    q.c('x', {  //x node to filter
                        xmlns: 'jabber:x:data',
                        type: 'submit'
                    });

                    let fields = [
                        {
                            type: 'hidden',
                            var: 'FORM_TYPE',
                            value: 'urn:xmpp:mam:2'
                        },
                        ...(!group ? [{
                            type: null,
                            var: 'with',
                            value: jid
                        }] : []),
                    ]

                    fields.forEach(f => {
                        q.c('field', {
                            var: f.var,
                            ...(f.type ? { type: f.type } : null)
                        }).c('value').t(f.value).up().up()
                    });

                    q.up(); //salir x node query

                } else {
                    //query for group mam archive

                    q = $iq({  //rsn node
                        type: 'set',
                        to: jid,
                        id: unique_id
                    }).c('query', {
                        xmlns: Strophe.NS.MAM,
                        queryid: this.getUniqueId(),
                        node: 'urn:xmpp:mucsub:nodes:messages'
                    });
                }

                if (q && count != null) {
                    q.c('set', {
                        xmlns: Strophe.NS.RSM
                    }).c('max').t(count).up();

                    // if (before){
                    //     q.c('before').t(before).up()  
                    // } else {
                    if (before) {
                        q.c('before').t(before).up();
                    } else {
                        q.c('before').up();
                    }


                    q.up() //salir del set
                }

                console.debug('Sending query history:');
                console.debug(q.tree());
                let promise = new Promise((resolve, reject) => {
                    this.connection.send(q);
                    this.connection.addHandler((iq) => {
                        console.debug(iq)
                        let fin_node = this.sizzle(`iq > fin[xmlns="${Strophe.NS.MAM}"][complete]`, iq).pop();
                        if (fin_node) {
                            let count_node = this.sizzle(`set[xmlns="${Strophe.NS.RSM}"] > count`, fin_node).pop();
                            let first_node = this.sizzle(`set[xmlns="${Strophe.NS.RSM}"] > first`, fin_node).pop();
                            let last_node = this.sizzle(`set[xmlns="${Strophe.NS.RSM}"] > last`, fin_node).pop();
                            if (count_node) {
                                let count = _.toInteger(count_node.textContent);
                                let end = fin_node.getAttribute('complete') == 'true';
                                let from = iq.getAttribute('from');
                                let to = iq.getAttribute('to');
                                let iq_type = iq.getAttribute('type');
                                let first = first_node ? first_node.textContent : null;
                                let last = first_node ? last_node.textContent : null;
                                resolve({
                                    type: 'mam',
                                    count,
                                    end,
                                    from,
                                    to,
                                    iq_type,
                                    first,
                                    last
                                });
                            }
                        }
                        return false

                    }, Strophe.NS.JABBER_CLIENT, 'iq', 'result', unique_id);
                });

                return promise;
            } catch (e) {
                console.error(e);
                throw e;
            }
        }).then(value => {
            return value;
        }).catch(e => {
            console.error(e)
        });

    }

    onMessageHandler(message_element) {
        this.processMessageHandler(message_element)
        return true;
    }

    async processMessageHandler(message_element) {
        console.debug(message_element)

        //group chat
        //pubsub event

        let data = this.extract_message_data(message_element)


        if (data) {
            // this.user_message_update.detail.type = data.msg_type;
            // this.user_message_update.detail.user_from = data.from;
            // this.user_message_update.detail.user_to = data.to;
            // this.user_message_update.detail.message = data.message;
            // this.user_message_update.detail.msg_id = data.msg_id;
            // this.user_message_update.detail.event = data.chat_state_event;
            // this.user_message_update.detail.group_nick = data.group_nick;
            // this.user_message_update.detail.stamp = data.stamp;
            // this.user_message_update.detail.mam = data.mam;
            if (!_.isEmpty(data.message) || data.chat_state_event != null) {
                if (this.user_message_update_callback) {
                    this.user_message_update_callback(data)
                }
                // document.dispatchEvent(this.user_message_update);
            }
        }
    }

    extract_message_data(node_with_message) {
        let message_node = null;
        if (node_with_message.tagName == 'message') {
            message_node = node_with_message
        } else {
            message_node = node_with_message.getElementsByTagName('message');
            if (message_node.length > 0) {
                message_node = message_node[0];
            }
        }

        if (message_node) {

            //result of mam (Message Archive Management) query
            let result_forwarded = this.sizzle(`result[xmlns="${Strophe.NS.MAM}"] > forwarded[xmlns="${Strophe.NS.FORWARDED}"]`, message_node).pop();
            if (result_forwarded) { //message result of mam query
                let message_inside = this.sizzle(`forwarded > message[xmlns="${Strophe.NS.JABBER_CLIENT}"]`, result_forwarded).pop(); //first message inside forwarded
                let delay_node = this.sizzle(`delay[xmlns="${Strophe.NS.DELAY}"][stamp]`, result_forwarded).pop();

                if (message_inside) {
                    let data = null;
                    let event_node = this.sizzle(`message > event[xmlns="${Strophe.NS.PUBSUB}"]`, message_inside).pop()
                    if (event_node) { //has event inside
                        let event_message = this.sizzle(`message[xmlns="${Strophe.NS.JABBER_CLIENT}"]`, event_node).pop();
                        if (event_message) {
                            data = this.extract_message_data(event_message);
                        }
                    } else {
                        data = this.extract_message_data(message_inside);
                    }
                    if (data) {
                        if (delay_node) {
                            data.stamp = delay_node.getAttribute('stamp');
                        }
                        data.mam = true;
                        return data;
                    }
                }
            }

            let items_message_node = this.sizzle(`message[xmlns="${Strophe.NS.JABBER_CLIENT}"] > event[xmlns="${Strophe.NS.PUBSUB}"] > items[node="urn:xmpp:mucsub:nodes:messages"]`, message_node).pop();
            if (items_message_node) {
                let message_inside = this.sizzle(`message[xmlns="${Strophe.NS.JABBER_CLIENT}"][type][from][to][id]`, items_message_node).pop();
                if (message_inside) {
                    let data = this.extract_message_data(message_inside);
                    if (data) {
                        return data;
                    }
                }
            }

            let oob_url = null;
            let oob_desc = null;

            let oob_node = this.sizzle(`message[xmlns="${Strophe.NS.JABBER_CLIENT}"] > x[xmlns="${Strophe.NS.OOB}"]`, message_node).pop();
            if (oob_node) {
                oob_url = oob_node.querySelector('url')?.textContent;
                oob_desc = oob_node.querySelector('desc')?.textContent;

            }


            let full_jid_from = message_node.hasAttribute('from') ? message_node.getAttribute('from') : null;
            let full_jid_to = message_node.hasAttribute('to') ? message_node.getAttribute('to') : null;
            let msg_type = message_node.hasAttribute('type') ? message_node.getAttribute('type') : null;
            let msg_id = message_node.hasAttribute('id') ? message_node.getAttribute('id') : null;

            let group_nick = null;
            if (msg_type == 'groupchat') {
                let all = full_jid_from.split('/');
                full_jid_from = all[0];
                group_nick = all[1];
            }

            //received tag
            let received_tag = message_node.getElementsByTagName('received');
            let received_id = received_tag.length > 0 ? received_tag[0].getAttribute('id') : null;

            //displayed tag
            let displayed_tag = message_node.getElementsByTagName('displayed');
            let displayed_id = displayed_tag.length > 0 ? displayed_tag[0].getAttribute('id') : null;

            //archived tag
            let archived_id = null;
            let archived_tag = this.sizzle(`archived[xmlns="urn:xmpp:mam:tmp"][id]`,message_node).pop(); 
            if (archived_tag){
                archived_id = archived_tag.getAttribute('id')
            }
            let chat_state_event = null;
            if (received_id != null) {
                chat_state_event = 'received';
                msg_id = received_id;
            } else if (displayed_id != null) {
                chat_state_event = 'displayed';
                msg_id = displayed_id;
            }

            //chat states
            let valid_states = ['composing', 'paused', 'inactive', 'active'];
            for (let state_index in valid_states) {
                let node = message_node.getElementsByTagName(valid_states[state_index]);
                if (node.length > 0 && node[0].getAttribute('xmlns') == Strophe.NS.CHATSTATES) {
                    chat_state_event = valid_states[state_index];
                    break;
                }
            }

            //delay stamp
            let stamp = null;
            let delay_node = message_node.getElementsByTagName('delay');
            if (delay_node.length > 0 && delay_node[0].getAttribute('xmlns') === 'urn:xmpp:delay') {
                stamp = delay_node[0].getAttribute('stamp');
            }


            let body_tag = message_node.getElementsByTagName('body');
            let message = body_tag.length == 1 ? body_tag[0].textContent : null;

            return {
                to: full_jid_to,
                from: full_jid_from,
                msg_type: msg_type,
                msg_id: msg_id,
                group_nick,
                chat_state_event: chat_state_event,
                message: message,
                stamp: stamp,
                oob: oob_url ? oob_url : false,
                oob_desc: oob_desc ? oob_desc : false,
                archived_id : archived_id
            }
        }
        return null;
    }

    async sendReceived(from, to, id) {
        return this.ConnectedOrWait().then(x => {
            try {
                let recv = $msg({
                    from: from,
                    to: to,
                    id: id
                }).c('received', {
                    xmlns: 'urn:xmpp:receipts',
                    id: this.getUniqueId()
                });
                console.debug(`Sending received response:${recv.toString()}`);
                this.connection.send(recv);
                return this
            } catch (e) {
                console.error(e);
            }

        }).catch(e => {
            console.error(e)
        });
    }

    async sendChatState(to, state, group = false) {
        if (!['composing', 'paused', 'inactive'].includes(state)) { //only supported states
            return;
        }

        return this.ConnectedOrWait().then(x => {
            try {
                let chat_state = $msg({
                    to: to,
                    type: group ? 'groupchat' : 'chat'
                }).c(state, {
                    xmlns: 'http://jabber.org/protocol/chatstates'
                });
                console.debug(`Sending chat states ${chat_state.toString()}`);
                this.connection?.send(chat_state);
                return this;
            } catch (e) {
                console.error(e);
            }

        }).catch(e => {
            console.error(e);
        });
    }

    async login(jid = null, pass = null) {
        if (this.connection) {
            try {
                let promise = new Promise((resolve, reject) => {
                    try {
                        if (jid) this.jid = jid;
                        if (pass) this.pass = pass;
                        if (this.connection_status !== Strophe.Status.CONNECTED &&
                            this.connection_status !== Strophe.Status.CONNECTING) {
                            this.connection.connect(this.jid, this.pass, (status, error) => {
                                try {
                                    this.onConnect(status, error)
                                    if (status === Strophe.Status.CONNECTED) {
                                        resolve(this)
                                    }
                                } catch (e) {
                                    reject(e)
                                }
                            });
                        }
                    } catch (e) {
                        reject(e)
                    }
                });
                return await promise;
            } catch (e) {
                console.error(e);
            }
        } else {
            return await this.connect().then(x => x.login(jid, pass));
        }
    }

    logout() { //
        if (this.connection) {
            try {
                this.sendPresence(false)
                this.user_status = UserStatus.UNAVAILABLE;
                this.connection.disconnect();
                if (this.status_update_callback) {
                    this.status_update_callback(this.user_status);
                }
                return this
            } catch (e) {
                console.error(e);
            }
        }
    }

    async changeStatus(status) {
        return this.ConnectedOrWait().then(x => {

            try {
                this.user_status = status
                if (this.connection_status == Strophe.Status.CONNECTED) {
                    this.sendPresence(true, status);
                    if (this.status_update_callback) {
                        this.status_update_callback(this.user_status);
                    }
                    // document.dispatchEvent(this.status_update_event);
                }
                return this
            } catch (e) {
                console.error(e)
            }
        }).catch(e => {
            console.error(e);
        })
    }

    async sendPresence(inout = true, status = null) {
        return this.ConnectedOrWait().then(x => {
            try {
                let p = null;
                if (!inout) p = $pres({ type: 'unavailable' })
                else p = $pres()

                if (status && status != 'available') p = p.c('show').t(status)

                //addcaps
                p.cnode(this.caps_node);

                //ability to speak muc
                if (inout) {
                    p.c('x', {
                        xmlns: 'http://jabber.org/protocol/muc'
                    });
                }


                console.debug(`Sending presence: ${p.toString()}`)
                this.connection.send(p);
                return this
            } catch (e) {
                console.error(e);
            }
        }).catch(e => {
            console.error(e)
        })
    }

    async sendMucPresence(muc_jid) {
        return this.ConnectedOrWait().then(x => {
            try {
                let p = $pres({
                    to: muc_jid,
                    id: this.getUniqueId()
                }).c('x', {
                    xmlns: 'http://jabber.org/protocol/muc'
                });
                console.debug(`Sending muc presence:${p.toString()}`);
                this.connection.send(p);
                return this
            } catch (e) {
                console.error(e);
            }
        }).catch(e => {
            console.error(e);
        });
    }

    async sendDisplayed(msg_id, to_jid) {
        return this.ConnectedOrWait().then(x => {

            try {
                let msg = $msg({
                    type: 'chat',
                    to: to_jid,
                }).c('displayed', {
                    xmlns: 'urn:xmpp:chat-markers:0',
                    id: msg_id
                });
                console.debug(`Sending displayed: ${msg.toString()}`);
                this.connection.send(msg);
                return this;
            } catch (e) {
                console.error(e);
            }
        }).catch(e => {
            console.error(e)
        })
    }

    async sendMessage(message, jid, sendActiveState = false, group = false, oob = null, oob_desc = null) {
        return this.ConnectedOrWait().then(x => {

            try {
                let msg = ($msg({
                    to: jid,
                    id: message.id,
                    type: group ? 'groupchat' : 'chat'
                })
                    .c('body').t(message.message).up()
                    .c('request', { xmlns: 'urn:xmpp:receipts' })).up();  //request receipt
                if (sendActiveState) {
                    msg.c('active', {
                        xmlns: "http://jabber.org/protocol/chatstates"
                    }).up();
                }
                if (oob) {  //out of band, send files
                    msg.c('x', {
                        xmlns: Strophe.NS.OOB
                    }).c('url').t(oob).up()
                    if (oob_desc) {
                        msg.c('desc').t(oob_desc).up()
                    }
                    msg.up()
                }
                console.debug(`Sending msg: ${msg.toString()}`)

                this.connection.send(msg);
                return this

            } catch (e) {
                console.error(e);
            }
        }).catch(e => {
            console.error(e);
        });
    }

    onConnect(status, error) {
        this.connection_status = status;
        console.debug('On connect status:'+status)
        if (status == Strophe.Status.CONNECTING) {
            console.debug('Strophe is connecting.');
        } else if (status == Strophe.Status.CONNFAIL) {
            console.debug('Strophe Connection Fail:')
            console.debug(error)
        } else if (status == Strophe.Status.DISCONNECTING) {
            console.debug('Strophe is disconnecting.');
        } else if (status == Strophe.Status.DISCONNECTED) {
            console.debug('Strophe is disconnected.');
            this.user_status =  UserStatus.UNAVAILABLE;
            if (this.status_update_callback){
                this.status_update_callback(this.user_status);
            }
        } else if (status == Strophe.Status.CONNECTED) {
            console.debug('Strophe is connected.');
            if (this.user_status === UserStatus.UNAVAILABLE) {
                this.user_status = UserStatus.AVAILABLE
                this.sendPresence().then(x => {
                    x.queryServices()
                });
                // this.queryServices();
            } else {
                this.sendPresence(true, this.user_status)

            }
            if (this.status_update_callback) {
                this.status_update_callback(this.user_status);
            }
            // document.dispatchEvent(this.status_update_event);
        }
    }

    async queryServices() {
        return this.ConnectedOrWait().then(x => {

            let unique_id = this.getUniqueId();
            let iq = $iq({
                id: unique_id,
                to: this.back_domain,
                type: 'get'
            }).c('query', {
                xmlns: Strophe.NS.DISCO_ITEMS
            });
            console.debug('Request service discovery');
            console.debug(iq.tree());
            this.connection.addHandler((iq) => {
                let items = this.sizzle(`iq > query[xmlns="${Strophe.NS.DISCO_ITEMS}"] item`, iq);
                items = items.map(i => ({
                    jid: i.getAttribute('jid'),
                }));
                this.disco_items = items;
                this.queryServiceInfo()

                return false;

            }, null, 'iq', 'result', unique_id);
            this.connection.send(iq);
            return this
        }).catch(e => {
            console.error(e)
        });
    }

    async queryServiceInfo() {
        if (this.connection && this.disco_items) {
            this.disco_items.forEach(di => {
                let unique_id = this.getUniqueId()
                let iq = $iq({
                    id: unique_id,
                    to: di.jid,
                    type: 'get'
                }).c('query', {
                    xmlns: Strophe.NS.DISCO_INFO
                });
                // console.debug('Querying disco info');
                // console.debug(iq.tree());
                this.connection.addHandler((iq) => {
                    // console.debug(iq);
                    let from = iq.getAttribute('from');
                    let identity_node = this.sizzle(`iq > query[xmlns="${Strophe.NS.DISCO_INFO}"] > identity[category][type]`, iq).pop();
                    if (identity_node) {
                        let cat = identity_node.getAttribute('category');
                        let type = identity_node.getAttribute('type');

                        //features
                        let features_nodes = this.sizzle(`iq > query[xmlns="${Strophe.NS.DISCO_INFO}"] > feature[var]`, iq);
                        let features = features_nodes.map(fn => fn.getAttribute('var'));

                        let x_nodes = this.sizzle(`iq > query[xmlns="${Strophe.NS.DISCO_INFO}"] > x[xmlns="${Strophe.NS.JABBER_DATA}"]`, iq);

                        let data = x_nodes.map(x => {
                            let fields_node = this.sizzle('field[var]', x);
                            let field = fields_node.map(fn => {
                                let value = this.sizzle('value', fn).pop()
                                if (value) {
                                    return {
                                        [fn.getAttribute('var')]: value.textContent
                                    }
                                }
                            });
                            return field.reduce((prev, curr) => {
                                return _.merge(prev, curr);
                            }, {});
                        });

                        let node = {
                            [cat]: {
                                [type]: {
                                    url: from,
                                    features: features,
                                    data: data
                                }
                            }
                        };
                        this.disco_items_info = _.merge(this.disco_items_info, node);
                        // console.debug(this.disco_items_info);
                    }
                }, null, 'iq', 'result', unique_id);
                this.connection.send(iq)
            })
        }
    }

    async queryFileUploadSlot(name, size, type) {
        return this.ConnectedOrWait().then(x => {
            let unique_id = this.getUniqueId();
            let promise = new Promise((resolve, reject) => {
                let upload_service = this.disco_items_info?.store?.file
                if (upload_service) {
                    let max_file_size = upload_service.data.find(d => d['FORM_TYPE'] == Strophe.NS.HTTP_FILE_UPLOAD)?.['max-file-size'];
                    if (!max_file_size) {
                        max_file_size = 5 * 1024 * 1024; //default to 5MB
                    }
                    if (size > max_file_size) {
                        reject(`Max file size is: ${max_file_size}`);
                    }


                    let iq = $iq({
                        id: unique_id,
                        to: upload_service.url,
                        type: 'get'
                    }).c('request', {
                        xmlns: Strophe.NS.HTTP_FILE_UPLOAD,
                        filename: name,
                        size: size,
                        'content-type': type
                    });
                    console.debug('Requesting upload slot');
                    console.debug(iq.tree());
                    this.connection.addHandler(iq => {
                        console.debug(iq);
                        let slot_node = this.sizzle(`slot[xmlns="${Strophe.NS.HTTP_FILE_UPLOAD}"]`, iq).pop();
                        if (slot_node) {
                            let put_node = this.sizzle('put[url]', slot_node).pop();
                            let headers = {}
                            let put_url = ''
                            if (put_node) {
                                put_url = put_node.getAttribute('url');
                                let headers_node = this.sizzle('header[name]', put_node);
                                headers = headers_node.reduce((prev, curr) => {
                                    return _.merge(prev, {
                                        name: curr.getAttribute('name'),
                                        value: curr.textContent
                                    });
                                }, {});
                            }
                            let get_url = ''
                            let get_node = this.sizzle('get[url]', slot_node).pop();
                            if (get_node) {
                                get_url = get_node.getAttribute('url');
                            }
                            resolve({
                                put: put_url,
                                headers: headers,
                                get: get_url
                            });
                        } else {
                            reject('Unknow response from server')
                        }
                    }, null, 'iq', 'result', unique_id);

                    this.connection.send(iq);


                } else {
                    reject('No upload service found')
                }
            }); //end promise declaracion

            return promise;
        }).then(values => {
            return values;
        }).catch(e => {
            console.error(e)
        })
    }
}

const xmppapi = XmppApiSingleton.getInstance()
if (process.env.NODE_ENV == 'development') {
    document.xmppapi = xmppapi
}
export { xmppapi }