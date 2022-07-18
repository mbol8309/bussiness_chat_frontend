// import { createSlice } from "@reduxjs/toolkit"

const createSlice = () => {}

const initialChatState = {
    chatOpened: false,
    unreadMsg: 0
}

const chatslices = createSlice({
    name: 'XmppChat',
    initialState: initialChatState,
    reducers: {
        setChatOpen: (state, { payload }) => {
            state.chatOpened = payload
        },
        setMsgUnread: (state, { payload }) => {
            state.unreadMsg = payload
        }
    }
});

const setXmppChatOpen = (value) => {
    return async (dispatch) => {
        dispatch(chatslices.actions.setChatOpen(value));
    }
}

const setXmppMsgUnread = (value) => {
    return async (dispatch) => {
        dispatch(chatslices.actions.setMsgUnread(value));
    }
}

export { setXmppChatOpen , setXmppMsgUnread }
export default chatslices;//.reducer;