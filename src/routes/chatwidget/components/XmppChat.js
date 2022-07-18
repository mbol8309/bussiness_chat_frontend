import React, { useEffect, useRef, useState } from "react";
// import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import ChatWidget from "./ChatWidget";
// import { useDispatch, useSelector } from "react-redux";
import { xmppapi } from '../common/xmppapi';
import Api from "../../../common/api";
import { Backdrop, Badge, Box, Fab, Grow, IconButton, Slide } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MessageIcon from '@mui/icons-material/Message';
import { useWindowSize } from "react-use";
// import { setXmppChatOpen } from "../slices/xmppchatslices";
import { XmppApiContext } from "../common/common";
import { makeStyles } from "@mui/styles";
// import { useSnackbar } from "notistack";



const useStyle = makeStyles((theme) => ({
  fab: {
    position: "fixed",
    bottom: 100,
    right: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'right',
    flexFlow: 'wrap-reverse',
    zIndex: 1500
  },
  chatWindow: {

  },
  backdrop: {
    zIndex: 1490,
  }
}))
const XMPP_SERVER_DOMAIN = process.env.REACT_APP_XMPP_SERVER_DOMAIN;
const XMPP_SOCKET_URL = process.env.REACT_APP_XMPP_SOCKET_URL;



const XmppHeaderButton = () => {
  const dispatch = null; //useDispatch();
  const { chatOpened, unreadMsg } = { chatOpened: null, unreadMsg: null };//  useSelector(state => state.XmppChat);
  const handleOnClick = () => {
    if (!chatOpened) {
      // dispatch(setXmppChatOpen(true));
    }
  }

  return (
    <IconButton onClick={handleOnClick} size="large">
      <Badge badgeContent={unreadMsg} color='secondary'>
        <MessageIcon />
      </Badge>
    </IconButton>
  );
}

export { XmppHeaderButton }

const XmppChat = ({ useFloatingButton = true }) => {

  const { authUser } = { authUser: null };// useSelector((state) => state.auth);
  const xmpp = useRef()
  // const { enqueueSnackbar } = useSnackbar();
  const DEFAULT_DOMAIN = '@' + XMPP_SERVER_DOMAIN ? XMPP_SERVER_DOMAIN : 'localhost';
  const DEFAULT_WS_BOSH_URL = XMPP_SOCKET_URL ? XMPP_SOCKET_URL : 'ws://localhost/ws';

  const dispatch = null;//useDispatch();

  const classes = useStyle();

  const { chatOpened, unreadMsg } = { chatOpened: null, unreadMsg: null };//useSelector(state => state.XmppChat);

  const [chatCredentials, setChatCredentials] = useState(null);
  // const [openChat, setOpenChat] = useState(false);
  // const [unreadTotal, setUnreadTotal] = useState(0);
  const chatRef = useRef();
  const handleFabClick = async (value = null) => {
    // setOpenChat(true);
    if (!chatOpened) {
      // dispatch(setXmppChatOpen(true));
    }
  }

  const handleCloseChat = () => {
    if (chatOpened) {
      // setOpenChat(false)
      // dispatch(setXmppChatOpen(false));
    }
  }

  const getCredentials = async () => {
    let cred = await Api.getChatCredentials();
    if (cred?.data) {
      let user = {
        ...authUser,
        ...cred.data,
      }
      setChatCredentials(user);
      console.debug(`Login with: ${user.jid} pass:${user.jid_password}`)
      xmpp.current.login(user.jid, user.jid_password).then(x => {
        console.debug('Logged in....')
      }).catch(e => {
        console.error(e);
      });
    }
  }

  const { width, height } = useWindowSize();

  useEffect(() => {
    XmppConnect();
  }, [])

  const XmppConnect = async () => {
    if (!xmpp.current) {
      xmpp.current = xmppapi;
      // xmppapi.setDomain(DEFAULT_DOMAIN);
      // xmppapi.setUrl(DEFAULT_WS_BOSH_URL)
      try {
        xmpp.current.connect(DEFAULT_DOMAIN);
      } catch (e) {
        console.error(e);
      }
    }
  }

  useEffect(() => {
    if (authUser) {
      getCredentials()
    }
  }, [authUser])

  useEffect(() => {
    if (unreadMsg > 0 && !chatOpened) {
      showSnackNotification()
    }
  }, [unreadMsg])

  const showSnackNotification = async () => {

    // enqueueSnackbar(`Received new message`, 
    // {
    //   action: (key) => (
    //     <Button
    //       onClick={() => {
    //         setOpenChat(true);
    //       }}
    //       style={{ color: '#fff', fontSize: 12 }}
    //       size='small'
    //       text='open'
    //     />
    //   )
    // }
    // );
  }


  return (
    <>
      {/* <div style={{ display: chatOpened ? 'block' : 'nonce', backgroundColor: '#AAA', position: 'fixed', right: 0, top: 0, bottom: 0, left: 0 }} onClick={handleCloseChat}></div> */}
      <Backdrop
        className={classes.backdrop}
        open={Boolean(chatOpened)} onClick={handleCloseChat} />
      <Box className={classes.fab}>
        <Slide in={Boolean(true)} direction='left'>
          <div className={classes.chatWindow} style={{ position: 'fixed', right: 0, top: 0, bottom: 0, height: height, width: width / 2 }}>
            <XmppApiContext.Provider value={xmpp.current}>
              <ChatWidget
                key='chatwidget'
                mainUser={chatCredentials}
                isOpen={chatOpened}
                handleChangeFocus={handleFabClick} />
            </XmppApiContext.Provider>
          </div>
        </Slide>
        {false &&
          <Grow in={!chatOpened}>
            <Fab onClick={handleFabClick} color={!chatOpened ? 'primary' : 'default'}  >
              <Badge badgeContent={unreadMsg} color='secondary'>
                <ChatBubbleOutlineIcon />
              </Badge>
            </Fab>
          </Grow>
        }
      </Box>
    </>
  )

}

export default XmppChat