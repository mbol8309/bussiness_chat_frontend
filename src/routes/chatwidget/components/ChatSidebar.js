import { Avatar, AvatarGroup, Conversation, ConversationList, Accordion, MessageSeparator, Search, Sidebar, TypingIndicator } from "@chatscope/chat-ui-kit-react";
import { Collapse, Avatar as MuiAvatar } from "@mui/material";
import React, { useEffect, useState } from "react";
import ChatMainUser from "./ChatMainUser";
import GroupIcon from '@mui/icons-material/Group';
import StyledBadge from "./StyledBadge";


//state for minute conversion to time hours, days
function useMinConv(timeInMin) {
    const [min, setMin] = useState(null);
    const units = {
        "year": 24 * 60 * 365,
        "month": 24 * 60 * 30,
        "week": 24 * 60 * 7,
        "day": 24 * 60,
        "min": 1
    }

    useEffect(() => {
        if (timeInMin > 0) {
            for (let name in units) {
                let p = Math.floor(timeInMin / units[name]);
                if (p == 1) {
                    setMin(p + ' ' + name)
                    break;
                }
                if (p >= 2) {
                    setMin(p + ' ' + name + 's')
                    break;
                }
            }
        } else {
            setMin(null)
        }
    }, [timeInMin])
    return min;
}

function useSearchText(text, reg) {
    const [find, setFind] = useState(false)
    useEffect(() => {
        let res = text?.search(new RegExp(reg, "i"));
        setFind(res == -1);
    }, [text, reg])

    return find;
}

function useGetLastMessage(user) {
    const [lastMessage, setLastMessage] = useState({
        id: 0,
        message: null,
        from: null,
        to: null
    });

    useEffect(() => {
        if (user.messagesOrder && user.messagesOrder.length > 0) {
            setLastMessage(user.messagesStore[user.messagesOrder[user.messagesOrder.length - 1]]);
        }
    }, [user])
    return lastMessage;
}

// function useUnreadCounter(user) {  //moved counter to chatwidget component
//     const [counter, setCounter] = useState(0);
//     useEffect(() => {
//         let count = Object.keys(user.messagesStore).filter(k => user.messagesStore[k].unread).length;
//         if (_.toInteger(count) >= 0)
//             setCounter(count);
//     }, [user])

//     return counter;
// }

function useGroupName(group) {
    const [name, setName] = useState('');
    useEffect(() => {
        if (group) {
            let _n = group.roomjid.split('@')[0];
            _n = _n.charAt(0).toUpperCase() + _n.slice(1);
            setName(_n);
        }
    }, [group])
    return name;
}

const UserSidebarConversations = React.memo(({ user, searchText, onSelect, userActive }) => {

    const lastMessage = useGetLastMessage(user);
    return (
        <Collapse in={!useSearchText(user.name, searchText)}>
            <Conversation
                name={user.name}
                lastSenderName={lastMessage?.from}
                info={lastMessage?.message ? lastMessage?.message : user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
                unreadCnt={user.unreadCnt + user.unread_persistent}
                active={user.jid == userActive}
                onClick={() => onSelect(user)}
                lastActivityTime={useMinConv(user.lastActivity)}
            >
                <StyledBadge as={'Avatar'}
                    variant='dot'
                    overlap="circular"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    status={user.status}
                >
                    <MuiAvatar as={'Avatar'} alt={user.name} src={user.avatar ? user.avatar : 'http://'} />
                </StyledBadge>
                {/* <Avatar src={user.avatar ? user.avatar : noimage} name={user.name} status={user.status} /> */}
                <Conversation.Operations visible>
                    {user.chat_state == 'composing' && <TypingIndicator />}
                </Conversation.Operations>
            </Conversation>
        </Collapse>)
}, (prev, next) => {
    let result =
        (prev.userActive == next.userActive ||
            ((prev.userActive != prev.user.jid) && (next.userActive != next.user.jid)) //si el usuario que se selecciono no es el actual
        ) &&
        prev.searchText == next.searchText &&
        prev.user.name == next.user.name &&
        prev.user.lastActivity == next.user.lastActivity &&
        prev.user.unreadCnt == next.user.unreadCnt &&
        prev.user.unread_persistent == next.user.unread_persistent &&
        prev.user.avatar == next.user.avatar &&
        prev.user.status == next.user.status &&
        prev.user.chat_state == next.user.chat_state
    return result
})

const GroupsSidebarConversations = React.memo(({ group, searchText, onSelect, userActive }) => {

    const group_name = useGroupName(group);
    const last_message = useGetLastMessage(group);

    return (
        <Collapse in={!useSearchText(group.name, searchText)}>
            <Conversation
                name={group_name}
                lastSenderName={last_message?.from}
                info={last_message?.message}
                onClick={() => onSelect(group)}
                active={group.jid == userActive}
                unreadCnt={group.unreadCnt + group.unread_persistent}
            >
                <MuiAvatar as={'Avatar'} style={{ marginRight: 10 }}>
                    <GroupIcon />
                </MuiAvatar>
                {/* <Conversation.Operations visible>
                    {group.chat_state == 'composing' && <TypingIndicator />}
                </Conversation.Operations> */}
            </Conversation>
        </Collapse>)
}, (prev, next) => {
    let result =
        (prev.userActive == next.userActive ||
            ((prev.userActive != prev.group.jid) && (next.userActive != next.group.jid)) //si el usuario que se selecciono no es el actual
        ) &&
        prev.searchText == next.searchText &&
        prev.group.unreadCnt == next.group.unreadCnt &&
        prev.group.unread_persistent == next.group.unread_persistent
    return result;
})

const ChatSidebar = ({
    users = [],
    groups = [],
    mainUser = null,
    userActive = null,
    onSelect,
    usersLoadingState = false,
    groupsLoadingState = false }) => {

    const [searchText, setSearchText] = useState('')

    const sortUsers = (u1, u2) => {
        if (u1.unreadCnt + u1.unread_persistent > u2.unreadCnt + u2.unread_persistent) return -1
        if (u1.unreadCnt + u1.unread_persistent < u2.unreadCnt + u2.unread_persistent) return 1
        if (u1.unreadCnt + u1.unread_persistent == u2.unreadCnt + u2.unread_persistent) {
            if (u1.status == 'available' && u2.status != 'available') return -1
            if (u1.status != 'available' && u2.status == 'available') return 1
            if ((u1.status == 'available' && u2.status == 'available')
                || (u1.status != 'available' && u2.status != 'available')) {
                if (u1.name < u2.name) return -1
                if (u1.name > u2.name) return 1
                if (u1.name == u2.name) return 0
            }
        }
    }

    const sortGroups = (g1, g2) => {
        return g1.unreadCnt + g1.unread_persistent > g2.unreadCnt + g2.unread_persistent ? -1 : (g1.name < g2.name ? -1 : 1)
    }

    return (
        <Sidebar position="left" scrollable={true}>
            <ChatMainUser user={mainUser} />
            <MessageSeparator />
            <Search placeholder="Search..." value={searchText} onChange={(value) => setSearchText(value)} onClearClick={() => setSearchText('')} />
            {/* {Object.keys(groups).length > 0 &&
                <Accordion title='Groups'> */}
            <ConversationList loading={usersLoadingState || groupsLoadingState}>
                {Object.values(groups).sort(sortGroups).map((group) => (
                    <GroupsSidebarConversations key={group.roomjid} group={group} searchText={searchText} onSelect={onSelect} userActive={userActive} as={'Conversation'} />
                ))}
                {/* </ConversationList>
                </Accordion>
            } */}
                {/* {Object.keys(users).length > 0 &&
                <Accordion title='Users'>

                    <ConversationList loading={usersLoadingState}> */}
                {Object.values(users).sort(sortUsers).map((user) => (
                    <UserSidebarConversations key={user.id} user={user} searchText={searchText} onSelect={onSelect} userActive={userActive} as={'Conversation'} />
                ))}
            </ConversationList>
            {/* </Accordion>
            } */}
        </Sidebar>
    )
}

export default ChatSidebar;