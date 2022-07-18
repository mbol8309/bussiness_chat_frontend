import React, { forwardRef, useCallback, useContext, useEffect, useState } from "react";
import { MainContainer} from "@chatscope/chat-ui-kit-react";
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { makeStyles } from "@mui/styles";
import ChatSidebar from "./ChatSidebar";
import ChatMessageBox from "./ChatMessageBox";
import _ from "lodash";
import { Strophe } from  'strophe.js'
import { xmppapi } from '../common/xmppapi'
import { UserStatus, XmppApiContext } from "../common/common";
import Api from "../../../common/api";
import { useAudio, useLatest } from "react-use";
import moment from "moment";
// import { useDispatch, useSelector } from "react-redux";
import { setXmppMsgUnread } from "../slices/xmppchatslices";
import { useDropzone } from "react-dropzone";
import FileUpload from "../service/FileUpload";

const useStyles = makeStyles((theme) => ({
  ChatWindow: {
    height: '100%',
    width: '100%'
  }
}))

const BaseUserData = (jid, additional = {}) => {
  let data = {
    id: xmppapi.getUniqueId(),
    name: jid,
    jid: jid,
    jid_type: 'user',
    status: UserStatus.UNAVAILABLE,
    avatar: null,
    info: null,
    lastSenderName: null,
    lastActivity: 0,
    messagesStore: {},
    messagesOrder: [],
    chat_state: null,
    last_chat_state_send: null,
    unreadCnt: 0,
    history_load: null,
    history_pointer: null
  };

  return _.merge(data, additional);
}

const BaseGroupData = (jid, additional = {}) => {
  let data = {
    id: jid,
    name: jid.split('@')[0],
    roomjid: jid,
    jid: jid,
    jid_type: 'group',
    messagesStore: {},
    messagesOrder: [],
    chat_state: null,
    last_chat_state_send: null,
    send_presence: false,
    unreadCnt: 0,
    history_load: null,
    history_pointer: null
  };

  return _.merge(data, additional);
}

function UnreadCounter(store) {
  let count = Object.values(store).filter(v => v.unread).length;
  count = _.toInteger(count);
  return count;
}



function addMessage(user, message) {
  let mo = user?.messagesOrder ? user.messagesOrder : [];
  let ms = user?.messagesStore ? user.messagesStore : {};
  // let _order = Object.hasOwn(ms, message.id)
  //   ? [...mo]
  //   : [...mo,
  //   message.id
  //   ];
  let _store = {
    ...ms,
    [message.id]: {
      ...message,
      ...ms[message.id]
    }
  };

  let _order = Object.values(_store).sort((m1, m2) => {
    return moment(m1.sentTime).diff(moment(m2.sentTime));
  }).map(m => m.id);

  return {
    messagesStore: _store,
    messagesOrder: _order,
    unreadCnt: UnreadCounter(_store)
  }
}

function modifyMessage(user, message) {
  let ms = user?.messagesStore ? user.messagesStore : {};
  let _store = {
    ...ms,
    [message.id]: {
      ...ms[message.id],
      ...message
    }
  };
  let _order = Object.values(_store).sort((m1, m2) => {
    return moment(m1.sentTime).diff(moment(m2.sentTime));
  }).map(m => m.id);

  return {
    messagesStore: _store,
    messagesOrder: _order
  }
}

function useUnreadCounter(users_groups) {
  const [counter, setCounter] = useState(0);
  useEffect(() => {
    if (users_groups) {
      let _c = Object.values(users_groups).reduce(
        (total_users, curr_user) => {
          return total_users + Object.values(curr_user.messagesStore).reduce(
            (total_users_messages, curr_user_message) => {
              return curr_user_message.unread ? total_users_messages + 1 : total_users_messages
            }, 0) + (curr_user.unread_persistent ? curr_user.unread_persistent : 0)
        }, 0)

      setCounter(_c);
    }
  }, [users_groups])

  return counter;
}

const DropArea = React.memo(function DropArea({ enter = false }) {

  return (
    <div style={{
      border: "3px",
      padding: 15,
      backgroundColor: enter ? '#3232e7' : 'transparent',
      borderStyle: 'dashed',
      borderColor: enter ? '#000' : 'transparent',
      height: enter ? '100%' : 0,
      width: enter ? '100%' : 0,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: enter ? 4 : 0,
      display: 'flex',
      alignItems: 'center',
      opacity: 0.8
    }}>
      {
        enter &&
        <p style={{ marginLeft: 'auto', marginRight: 'auto', color: '#FFF', fontSize: 18 }}>Drop the files here ...</p>
      }
    </div>
  )
}, (prev, next) => {
  return prev.enter == next.enter
});

const ChatWidget = forwardRef(({ mainUser = null }, ref) => {

  const classes = useStyles();
  const [activeJID, setActiveJID] = useState(null);
  const activeJIDLatestState = useLatest(activeJID);
  const [audio, audioState, controls, audio_ref] = useAudio({
    src: '/static/mp3/message-pop.mp3'
  });

  const xmpp = useContext(XmppApiContext);

  const dispatch = null ;//useDispatch();
  const { chatOpened, unreadMsg } = {chatOpened: null, unreadMsg: null};// useSelector(state => state.XmppChat);
  const [fileUploads, setFileUploads] = useState({})

  const [loadingContactList, setLoadingContactList] = useState(false)
  const loadingContactListLatestState = useLatest(loadingContactList);
  const [loadingGroupList, setLoadingGroupList] = useState(false)
  const loadingGroupListLatestState = useLatest(loadingGroupList);

  const [currentUser, setCurrentUser] = useState(null)
  const currentUserLatestState = useLatest(currentUser);

  const [users, setUsers] = useState({});
  const usersLatestState = useLatest(users);
  const [groups, setGroups] = useState({});
  const groupsLatestState = useLatest(groups);

  const unread_users = useUnreadCounter(users);
  const unread_groups = useUnreadCounter(groups);

  useEffect(() => {
    // dispatch(setXmppMsgUnread(unread_groups + unread_users))
  }, [unread_users, unread_groups])

  const storeUnreadCounter = async (from, count = 0) => {
    let { data } = await Api.setUserStoreUnread(from, count)
    console.log(`Unread counter total:${data}`);
  }

  const iq_message_received = async (data) => {
    console.debug(data);


    if (data.type == 'mam') { //mam result
      let { from, to, count, end, iq_type } = data;
      if (end) { // last page
        if (Object.hasOwn(users, from)) {

        }
      }

    }
  }

  const handleSelectedFile = (files, user) => {
    if (files) {
      let allFiles = null
      if (_.isArray(files)) {
        allFiles = files
      } else {
        allFiles = [files]
      }

      //query slots for file upload
      allFiles.forEach(async (file) => {
        let file_id = _.uniqueId('file_');
        try {
          let slot = await xmpp.queryFileUploadSlot(file.name, file.size, file.type);

          let url = new URL(slot.put);

          let fileupload = new FileUpload(url.origin);
          let CancelToken = fileupload.cancelToken();

          const onprogress = (event) => {
            let progress = event.total > 0 ? event.loaded / event.total : 0
            progress = Math.round(progress * 100);
            setFileUploads(fu => ({
              ...fu,
              [file_id]: {
                ...fu[file_id],
                progress: progress
              }
            }));
          }

          let file_info = {
            get: slot.get,
            name: file.name,
            type: file.type,
            size: file.size,
            to: user
          };

          setFileUploads(fu => ({
            ...fu,
            [file_id]: {
              ...fu[file_id],
              ...file_info,
              progress: 0,
              put: slot.put,
              get: slot.get,
              to: user,
              cancel_token: CancelToken
            }
          }));
          let axios_put = await fileupload.upload(file, slot.put, slot.headers, onprogress, CancelToken.token);
          console.debug(axios_put);
          if (axios_put.status == 200 || axios_put.status == 201) {
            handleFileUpload(file_info);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setFileUploads(fu => {

            delete fu[file_id]
            return {
              ...fu
            }
          });
        }
      })
    }
  }

  //register event handlers the first time
  useEffect(() => {
    controls.seek(0);
  }, [])

  //------------------------------Update Users
  const updateUsers = useCallback(async (updateFunction) => {
    setUsers(u => ({
      ...u,
      ...updateFunction(u)
    }));
  }, []);

  const handleFileUpload = async (file_info) => {
    if (file_info) {
      let { to, get, name } = file_info
      if (to && usersLatestState.current[to]) { //handle send to users

        let updateFunction = (u) => {
          let newmessage = {
            id: xmpp.getUniqueId(),
            from: currentUserLatestState.name,
            to: u[to].name,
            message: get,
            direction: 'outgoing',
            unread: false,
            sentTime: moment(),
            oob: get,
            oob_desc: name
          };
          xmpp.sendMessage(newmessage, to, u[to]?.last_chat_state_send != 'active', false, get, name);
          let newUserData = {
            [to]: {
              ...u[to],
              ...addMessage(u[to], newmessage),
            }
          }
          return newUserData;
        }

        updateUsers(updateFunction);
      }
      if (to && groupsLatestState.current[to]) {
        let updateFunction = (g) => {
          let newmessage = {
            id: xmpp.getUniqueId(),
            from: currentUserLatestState.current.name,
            to: g[to].name,
            message: get,
            direction: 'outgoing',
            unread: false,
            sentTime: moment(),
            oob: get,
            oob_desc: name
          };

          xmpp.sendMessage(newmessage, to, g[to].last_chat_state_send != 'active', true, get, name);
          let newGroupData = {
            [to]: {
              ...g[to],
              ...addMessage(g[to], newmessage)
            }
          };
          return newGroupData;
        }
        updateGroups(updateFunction);
      }
    }
  };

  //------------------------------Update Groups
  const updateGroups = useCallback(async (updateFunction) => {
    setGroups(g => ({
      ...g,
      ...updateFunction(g)
    }));
  }, []);

  //-------------------------------Get Contact List
  const getContactList = useCallback(async () => {
    console.debug('loading contact list');
    setLoadingContactList(true)
    try {
      let { data } = await Api.getChatContacts();

      if (data.data) {
        data = data.data;

        let updateFunction = (u) => {
          let newUsersData = data.reduce((obj, curr) => {
            return {
              ...obj,
              [curr.jid]: {
                ...BaseUserData(curr.jid),
                ...u[curr.jid],
                ...curr,
                name: curr.dropdown_name,
                avatar: _.isEmpty(curr.avatar) ? null : curr.avatar,
                info: curr.email,
                unread_persistent: (curr.chatdata?.data?.unread_msgs != null ? _.toInteger(curr.chatdata.data.unread_msgs) : 0),
                // last_read_persistent: curr.chatdata?.data?.last_read_time != null ? curr.chatdata.data.last_read_time : moment()
              }
            }
          }, {});
          return newUsersData;
        }

        updateUsers(updateFunction);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContactList(false)
    }
  }, [users]);
  //--------------------------------------Get Groups List
  const getGroupList = useCallback(async () => {
    try {
      if (!loadingGroupList) {
        setLoadingGroupList(true);
        let { data } = await Api.getUserChatRooms();

        let updateFunction = (g) => {
          let newGroupsData = data.reduce((obj, curr) => {
            let name = curr.roomjid.split('@')[0];
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return {
              ...obj,
              [curr.roomjid]: {
                ...BaseGroupData(curr.roomjid),
                ...g[curr.roomjid],
                ...curr,
                name: name,
                jid_type: 'group',
                unread_persistent: (curr.chatdata?.data?.unread_msgs != null ? _.toInteger(curr.chatdata.data.unread_msgs) : 0),
                // last_read_persistent: curr.chatdata?.data?.last_read_time != null ? curr.chatdata.data.last_read_time : moment()
              }
            };
          }, {});
          return newGroupsData;
        }
        updateGroups(updateFunction);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroupList(false);
    }
  }, [groups])

  //-------------------------------Change User Status
  const setUserStatus = useCallback(async (status) => {
    setCurrentUser(user => {
      return {
        ...user,
        status: status
      };
    });
  }, [currentUser])

  //-------------------------------Update Single Contact
  const updateSingleContact = useCallback(async (jid) => {
    if (!loadingContactListLatestState.current) {
      try {
        let { data } = await Api.getChatSingleContact(jid);
        if (data.data) {
          data = data.data;
          let updateFunction = (u) => {
            let newUserData = {
              [jid]: {
                ...BaseUserData(jid),
                ...u[jid],
                ...data,
                name: data.dropdown_name,
                avatar: _.isEmpty(data.avatar) ? null : data.avatar,
                info: data.email,
                unread_persistent: (data.chatdata?.data?.unread_msgs != null ? _.toInteger(data.chatdata.data.unread_msgs) : 0),
              }
            }
            return newUserData;


          }


          updateUsers(updateFunction);
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [users, loadingContactList]);
  //-------------------------------Handle Send
  const handleSend = useCallback((message) => {
    if (activeJID && users[activeJID]) { //handle send to users

      let updateFunction = (u) => {
        let newmessage = {
          id: xmpp.getUniqueId(),
          from: currentUserLatestState.current.name,
          to: u[activeJIDLatestState.current].name,
          message: message,
          direction: 'outgoing',
          unread: false,
          sentTime: moment()
        };
        xmpp.sendMessage(newmessage, activeJIDLatestState.current, u[activeJIDLatestState.current]?.last_chat_state_send != 'active');
        let newUserData = {
          [activeJIDLatestState.current]: {
            ...u[activeJIDLatestState.current],
            ...addMessage(u[activeJIDLatestState.current], newmessage),
          }
        }
        return newUserData;
      }

      updateUsers(updateFunction);
    }

    if (activeJID && groups[activeJID]) { //handle send on groups

      let updateFunction = (g) => {
        let newmessage = {
          id: xmpp.getUniqueId(),
          from: currentUserLatestState.current.name,
          to: g[activeJIDLatestState.current].name,
          message: message,
          direction: 'outgoing',
          unread: false,
          sentTime: moment()
        };

        xmpp.sendMessage(newmessage, activeJIDLatestState.current, g[activeJIDLatestState.current].last_chat_state_send != 'active', true);
        let newGroupData = {
          [activeJIDLatestState.current]: {
            ...g[activeJIDLatestState.current],
            ...addMessage(g[activeJIDLatestState.current], newmessage)
          }
        };
        return newGroupData;
      }
      updateGroups(updateFunction);
    }
  }, [users, groups, currentUser, activeJID]);

  //--------------------------------Update when change [groups, users, activeJID, currentUser, xmpp
  useEffect(() => {

    //***************************************Messages Updates Handler
    const message_updates_handler = async (data) => {
      console.debug(data);
      let {
        from: user_jid_from,
        to: user_jid_to,
        message,
        msg_id,
        chat_state_event: msg_event,
        msg_type,
        group_nick,
        stamp,
        mam,
        oob,
        oob_desc,
        archived_id } = data;

      user_jid_from = Strophe.getBareJidFromJid(user_jid_from); //jid without domain
      user_jid_to = Strophe.getBareJidFromJid(user_jid_to); //jid without domain
      if (_.isEmpty(message) && msg_event == null) {
        return;
      }

      let outgoing = user_jid_from == currentUser.jid
      let user_jid = outgoing ? user_jid_to : user_jid_from;

      if (msg_event != null) { //an old messages was received or displayed

        switch (msg_event) {
          case 'received':
            if (msg_type == 'chat') {
              let updateFunction = (u) => {
                let message_modified = {
                  id: msg_id,
                  ...u[user_jid].messagesStore[msg_id],
                  received: true
                };
                let newUserData = {
                  [user_jid]: {
                    ...u[user_jid],
                    ...modifyMessage(u[user_jid], message_modified)
                  }
                };
                return newUserData;
              }

              updateUsers(updateFunction);
            }
            if (msg_type == 'groupchat') {
              //handle received on group chat
            }
            return;
            break;
          case 'displayed':
            if (msg_type == 'chat') {

              let updateFunction = (u) => {
                let msg_index = u[user_jid]?.messagesOrder ? u[user_jid].messagesOrder.indexOf(msg_id) : null;
                let newUserData = null;
                if (msg_index) {
                  let msgs_undisplayed = Object.keys(u[user_jid].messagesStore).filter(k => !u[user_jid].messagesStore[k].displayed && u[user_jid].messagesStore[k].direction == 'outgoing');
                  let msgs = u[user_jid].messagesOrder.slice(0, msg_index + 1).filter(mid => msgs_undisplayed.includes(mid));
                  let msgs_store = msgs.reduce((p, c) => (
                    {
                      ...p,
                      [c]: {
                        ...p[c],
                        displayed: true
                      }
                    }
                  ), u[user_jid].messagesStore);

                  newUserData = {
                    [user_jid]: {
                      ...u[user_jid],
                      messagesStore: msgs_store
                    }
                  };
                } else {
                  let newmessage = u[user_jid]?.messagesStore[msg_id] ? u[user_jid]?.messagesStore[msg_id] : { id: msg_id };
                  newmessage.displayed = true;
                  newUserData = {
                    [user_jid]: {
                      ...u[user_jid],
                      ...modifyMessage(u[user_jid], newmessage)
                    }
                  }
                }
                return newUserData;
              };

              updateUsers(updateFunction);
            }
            if (msg_type == 'groupchat') {
              //handle displayed on group chat
            }
            return;

            break;
          case 'composing':
            if (msg_type == 'chat') {

              let updateFunction = (u) => {
                let newUserData = {
                  [user_jid]: {
                    ...u[user_jid],
                    chat_state: 'composing'
                  }
                };
                return newUserData;
              }
              updateUsers(updateFunction);
            }
            if (msg_type == 'groupchat') {
              //handle composing on group chat
            }
            return;
            break;
          case 'paused':
          case 'inactive':
            if (msg_type == 'chat') {

              let updateFunction = (u) => {
                let newUserData = {
                  [user_jid]: {
                    ...u[user_jid],
                    chat_state: 'inactive'
                  }
                };
                return newUserData;
              }
              updateUsers(updateFunction);
            }
            if (msg_type == 'groupchat') {
              //handle paused on group chat
            }
            return;
            break;
        }
      }//new message income



      if (msg_id == null || _.isEmpty(message)) {
        return;
      }
      if (msg_type == 'chat') { //message from user

        if ((activeJIDLatestState.current != user_jid_from || !chatOpened) && mam == null) { //if the message is not for the user selected
          controls.play()
        } else if (user_jid_from != currentUser.jid) { //message for selected user and not myself
          xmpp.sendDisplayed(msg_id, user_jid_from);
        }


        let updateFunction = (u) => {
          let user_data = {
            ...BaseUserData(user_jid),
            ...u[user_jid],
            chat_state: msg_event == 'active' ? 'active' : null,
            history_pointer: archived_id !=null && u[user_jid]?.history_pointer == null ? archived_id : u[user_jid].history_pointer
          };



          let user_from_name = outgoing ? (currentUserLatestState.current ? currentUserLatestState.current.name : user_jid_to) : user_data.name;
          let user_to_name = outgoing ? user_data.name : (currentUserLatestState.current ? currentUserLatestState.current.name : user_jid_to);
          let unread = user_jid == activeJIDLatestState.current && chatOpened ? false : true;

          if (unread) {
            storeUnreadCounter(user_jid, (u[user_jid]?.unreadCnt ? u[user_jid].unreadCnt : 0) + (u[user_jid]?.unread_persistent ? u[user_jid].unread_persistent : 0) + 1);
          } else if (u[user_jid].unread_persistent > 0) {
            storeUnreadCounter(user_jid, 0);
          }

          let newmessage = {
            id: msg_id,
            from: user_from_name,
            to: user_to_name,
            message: message,
            direction: outgoing ? 'outgoing' : 'incoming',
            unread: unread,
            sentTime: stamp ? stamp : moment(),
            oob,
            oob_desc
          }

          if (!Object.hasOwn(u, user_jid)) {
            updateSingleContact(user_jid)
          }

          let newUserData = {
            [user_jid]: {
              ...user_data,
              ...addMessage(u[user_jid], newmessage),
            }
          };
          return newUserData;
        }
        updateUsers(updateFunction);
      }

      if (msg_type == 'groupchat') { //message from group

        let updateFunction = (g) => {
          let user_to_name = currentUserLatestState.current.name;
          let mark_unread = !chatOpened || user_jid_from != activeJIDLatestState.current ? (stamp ? false : true) : false;
          if ((activeJIDLatestState.current != user_jid_from || !chatOpened) && mark_unread) { //if the message is not for the user selected
            controls.play()
          }

          if (mark_unread) {
            storeUnreadCounter(user_jid_from, (g[user_jid_from]?.unreadCnt ? g[user_jid_from].unreadCnt : 0) + (g[user_jid_from]?.unread_persistent ? g[user_jid_from].unread_persistent : 0) + 1);
          } else if (g[user_jid_from].unread_persistent > 0) {
            storeUnreadCounter(user_jid_from, 0);
          }
          let newmessage = {
            id: msg_id,
            from: group_nick,
            to: user_to_name,
            message: message,
            direction: group_nick === g[user_jid_from]?.usernick ? 'outgoing' : 'incoming',
            unread: mark_unread,
            sentTime: stamp ? stamp : moment(),
            show_from: true,
            oob,
            oob_desc
          };

          //if group not loaded load group
          if (!Object.hasOwn(g, user_jid_from)) {
            getGroupList();
          }

          let newGroupData = {
            [user_jid_from]: {
              ...BaseGroupData(user_jid_from),
              ...g[user_jid_from],
              ...addMessage(g[user_jid_from], newmessage),
            }
          };
          return newGroupData
        }

        updateGroups(updateFunction);
      }

    };
    //***************************************END  Messages Updates Handler



    //***************************************Status Update Handler
    const update_status = async (data) => {
      let status = xmpp.user_status
      setUserStatus(status)
      if (status == UserStatus.AVAILABLE) {
        getContactList();
        getGroupList();
      }
    }
    //***************************************END Status Update Handler

    //***************************************User Presence Handler
    let user_presence_updates = async (data) => {
      console.debug(data);
      let { user_from: user_jid_from, user_to: user_jid_to, status } = data;
      if (status == 'xa') status = 'away'; //map away

      user_jid_from = Strophe.getBareJidFromJid(user_jid_from); //jid without domain
      user_jid_to = Strophe.getBareJidFromJid(user_jid_to); //jid without domain
      if (Object.hasOwn(groups, user_jid_from)) {
        //group presence.
        console.debug('received presence group');
        return;
      }
      if (user_jid_from == user_jid_to) { //self sending
        if (currentUser?.jid == user_jid_from) { //updating current user status
          setUserStatus(status)
        }
      } else {

        let updateFunction = (u) => {
          if (!Object.hasOwn(u, user_jid_from)) {
            updateSingleContact(user_jid_from);
          }
          let newUserData = {
            [user_jid_from]: {
              ...BaseUserData(user_jid_from),
              ...u[user_jid_from],
              status: status,
            }
          };
          return newUserData;
        }

        updateUsers(updateFunction);
      }
    }
    //***************************************END User Presence Handler

    xmpp?.onStatusUpdate(update_status);
    xmpp?.onUserMessageUpdate(message_updates_handler);
    xmpp?.onUserPresenceUpdate(user_presence_updates);
  }, [users, groups, currentUser, activeJID, xmpp])

  const changedActiveOrChatOpened = async () => {
    if (activeJID && users[activeJID] && chatOpened) {

      let unread_msg_keys = Object.keys(users[activeJID].messagesStore).filter(k => users[activeJID].messagesStore[k].unread);
      if (unread_msg_keys.length > 0 || users[activeJID].unread_persistent > 0) {
        //send displayed to last message
        if (unread_msg_keys.length > 0) {
          let last_msg = users[activeJID].messagesOrder[users[activeJID].messagesOrder.length - 1];
          xmpp.sendDisplayed(users[activeJID].messagesStore[last_msg].id, activeJID);
        }

        //if has history unread request history
        if (users[activeJID].unread_persistent > 0) {
          // let date = users[activeJID].last_read_persistent
          let data = await xmpp.queryHistoryFrom(activeJID, /*null,null,*/ null, false, users[activeJID].unread_persistent);
          if (data) { //last result
            setUsers(u => ({
              ...u,
              [activeJID]: {
                ...BaseUserData(activeJID),
                ...u[activeJID],
                // history_load: data.end ? true : null,
                history_pointer: data.first ? data.first : null
              }
            }));
          }
        }

        //mark messages unread
        setUsers(u => {
          let ms = Object.keys(u[activeJID].messagesStore).reduce((p, c) => {
            return {
              ...p,
              [c]: {
                ...u[activeJID].messagesStore[c],
                unread: false
              }
            }
          }, {}
          );
          let num = {
            ...u,
            [activeJID]: {
              ...u[activeJID],
              messagesStore: ms,
              unreadCnt: 0,
              unread_persistent: 0
            }
          }
          storeUnreadCounter(activeJID, 0);
          return num
        })
      } else if (users[activeJID]?.history_pointer == null && users[activeJID]?.history_load == null) { //even if as no unread message, pull last three, to know next page
        let data = await xmpp.queryHistoryFrom(activeJID, users[activeJIDLatestState.current]?.history_pointer,/*null,null,*/ false, 3);
        if (data) { //last result
          let updateFunction = (u) => {
            let newUserData = {
              [activeJIDLatestState.current]:{
                ...BaseUserData(activeJIDLatestState.current),
              ...u[activeJIDLatestState.current],
              history_load: data.end ? true : null,
              history_pointer: data.first ? data.first : null
              }
            }
            return newUserData;
          }
          updateUsers(updateFunction);
          // setUsers(u => ({
          //   ...u,
          //   [activeJID]: {
          //     ...BaseUserData(activeJID),
          //     ...u[activeJID],
          //     history_load: data.end ? true : null,
          //     history_pointer: data.first ? data.first : null
          //   }
          // }));
        }
      }
    }

    if (activeJID && groups[activeJID] && chatOpened) {

      if (!groups[activeJID].send_presence) {
        xmpp.sendMucPresence(`${activeJID}/${groups[activeJID].usernick}`)
      }
      let unread_msg_keys = Object.keys(groups[activeJID].messagesStore).filter(k => groups[activeJID].messagesStore[k].unread);
      if (unread_msg_keys.length > 0 || groups[activeJID].unread_persistent > 0) {

        //if has history unread request history
        if (groups[activeJID].unread_persistent > 0) {
          let data = await xmpp.queryHistoryFrom(activeJID, null, true, groups[activeJID].unread_persistent);
          if (data) { //last result
            setGroups(g => ({
              ...g,
              [activeJID]: {
                ...BaseUserData(activeJID),
                ...g[activeJID],
                history_load: data.end ? true : null,
                history_pointer: data.first ? data.first : null

              }
            }));
          }
        }
        setGroups(g => {
          let ms = Object.keys(g[activeJID].messagesStore).reduce((p, c) => {
            return {
              ...p,
              [c]: {
                ...g[activeJID].messagesStore[c],
                unread: false
              }
            }
          }, {}
          )
          let num = {
            ...g,
            [activeJID]: {
              ...BaseGroupData(activeJID),
              ...g[activeJID],
              messagesStore: ms,
              send_presence: true,
              unreadCnt: 0,
              unread_persistent: 0
            }
          }
          storeUnreadCounter(activeJID, 0);
          return num
        });
      } else if (groups[activeJID]?.history_pointer == null) { //even if as no unread message, pull last three, to know next page
        let data = await xmpp.queryHistoryFrom(activeJID, null, true, 3);
        if (data) { //last result
          setGroups(g => ({
            ...g,
            [activeJID]: {
              ...BaseUserData(activeJID),
              ...g[activeJID],
              history_load: data.end ? true : null,
              history_pointer: data.first ? data.first : null

            }
          }));
        }
      }
    }
  }

  useEffect(() => { //when change active user, mark all messages as read
    changedActiveOrChatOpened()
  }, [activeJID, chatOpened]);

  useEffect(() => {
    if (mainUser) {
      let user = {
        status: UserStatus.UNAVAILABLE,
        info: null,
        name: mainUser?.dropdown_name,
        ...mainUser
      }
      setCurrentUser(u => ({
        ...u,
        ...user
      }));
    }
  }, [mainUser])

  const handleOnSelect = async (user_or_group) => {
    if (user_or_group.jid_type === 'user') {
      handleChatStateUpdate('paused', user_or_group.jid); //send paused to other user
      setActiveJID(user_or_group.jid == activeJID ? null : user_or_group.jid)
    } else {
      if (user_or_group.jid_type === 'group') {
        setActiveJID(user_or_group.roomjid == activeJID ? null : user_or_group.roomjid)

      }
    }
  }

  const handleHistoryLoad = async (user) => {
    if (Object.hasOwn(users, user)) {

      try {

        // let oldertime = users[user].messagesOrder.length > 0 ? users[user].messagesStore[users[user].messagesOrder[0]].history_pointer : null
        let previous_pointer = users[user].history_pointer ? users[user].history_pointer : null
        let data = await xmpp.queryHistoryFrom(user, /*null, null,*/ previous_pointer)
        if (data) { //last result
          setUsers(u => ({
            ...u,
            [user]: {
              ...BaseUserData(user),
              ...u[user],
              history_load: data.end ? true : null,
              history_pointer: data.first ? data.first : null
            }
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (Object.hasOwn(groups, user)) {

      try {

        // let olderid = groups[user].messagesOrder.length > 0 ? groups[user].messagesStore[groups[user].messagesOrder[0]].history_pointer : null
        let previous_pointer = groups[user].history_pointer ? groups[user].history_pointer : null
        let data = await xmpp.queryHistoryFrom(user, /* null, null,*/ previous_pointer, true);
        if (data) { //last result
          setGroups(g => ({
            ...g,
            [user]: {
              ...BaseUserData(user),
              ...g[user],
              history_load: data.end ? true : null,
              history_pointer: data.first ? data.first : null

            }
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  const onDrop = useCallback(acceptedFiles => {
    if (activeJIDLatestState.current && acceptedFiles) {
      handleSelectedFile(acceptedFiles, activeJIDLatestState.current)
    }
  }, [activeJID])

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, noClick: true })

  const handleAttachClick = async () => {
    if (activeJIDLatestState.current) {
      open()
    }
  }
  const handleFileUploadCancel = async (fu_key) => {
    if (fileUploads[fu_key]?.cancel_token) {
      fileUploads[fu_key].cancel_token.cancel('User cancelled upload')
      setFileUploads(fu => {
        delete fu[fu_key];
        return { ...fu }
      })
    }
    console.log(fu_key)
  }

  const handleChatStateUpdate = async (state, user = null) => {
    let _u = user ? user : activeJID;
    if (_u && users[_u] && users[_u].status == 'available') {
      xmpp.sendChatState(_u, state);

      setUsers(us => ({
        ...us,
        [_u]: {
          ...us[_u],
          last_chat_state_send: state
        }
      }))

    }

    if (activeJID && groups[activeJID]) {
      xmpp.sendChatState(activeJID, state, true);

      setGroups(gs => ({
        ...gs,
        [activeJID]: {
          ...gs[activeJID],
          last_chat_state_send: state
        }
      }))

    }
  }

  return (
    <div className={classes.ChatWindow}>
      <div>{audio}</div>
      <MainContainer responsive>

        <ChatSidebar
          users={users}
          groups={groups}
          mainUser={currentUser}
          userActive={activeJID}
          onSelect={handleOnSelect}
          usersLoadingState={loadingContactList}
          groupsLoadingState={loadingGroupList} />
        <div {...getRootProps()} className="cs-chat-container" style={{ zIndex: 3 }}>
          <input {...getInputProps()} />
          <DropArea enter={isDragActive} />
          <ChatMessageBox
            user={activeJID && users[activeJID] ? (users[activeJID] ? users[activeJID] : null) : (activeJID && groups[activeJID] ? groups[activeJID] : null)}
            onSend={handleSend}
            onChatStateUpdate={handleChatStateUpdate}
            onHistoryLoad={handleHistoryLoad}
            onAttachClick={handleAttachClick}
            fileUploadsState={fileUploads}
            onFileUploadCancel={handleFileUploadCancel} />
          {/* <FileUploadProgress as={'Message'} fileuploads={fileUploads} /> */}
        </div>

      </MainContainer>
    </div>
  )

})

export default ChatWidget