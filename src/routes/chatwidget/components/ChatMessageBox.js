import { Avatar, ChatContainer, ConversationHeader, InfoButton, Message, MessageInput, MessageList, MessageSeparator, TypingIndicator } from "@chatscope/chat-ui-kit-react"
import { Box, Button, Collapse, IconButton, Paper, Popover, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import noimage from '/src/static/icons/no_image.jpg';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import moment from "moment";
import { useDebounce, useInterval } from 'react-use'
import _ from "lodash";
import DescriptionIcon from '@mui/icons-material/Description';
import { AttachFile as AttachFileIcon, Close as CloseIcon, EmojiEmotionsOutlined as EmojiEmotionsOutlinedIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, GetApp as GetAppIcon, Search as SearchIcon, Send as SendIcon } from "@mui/icons-material";
import { saveAs } from "file-saver";
import { Skeleton } from "@mui/lab";
import axios from 'axios'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { BigPlayButton, Player } from 'video-react';
import "video-react/dist/video-react.css"
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { Avatar as MuiAvatar } from "@mui/material";
import StyledBadge from "./StyledBadge";
import { UserStatus } from "../common/common";
import MimeIcons from "../Icons/mimeicons";
import LinearProgressWithLabel from "../../../components/LinearProgressWithLabel";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
    checkIcons: {
        marginLeft: 'auto'
    },
    imgTools: {
        backgroundColor: '#000',
        position: 'absolute',
        height: 50,
        width: 200,
        opacity: 0.3,
        color: '#FFF',
        display: 'none'
    },
    imgToolButton: {
        '&:hover': {
            backgroundColor: '#7e7e7e'
        }
    },

}))

const imgCache = {  //very simple cache
    __cache: {},
    has(src) {
        return Object.hasOwn(this.__cache, src);
    },
    getCache(src) {
        return this.__cache[src];
    },
    setCache(src, value) {
        this.__cache[src] = value
    },
};

const MessageCheckMark = ({ message }) => {
    const classes = useStyles();

    if (message.received && !message.displayed) {
        return (<DoneIcon as={'Avatar'} fontSize='small' color='primary' className={classes.checkIcons} />)
    }
    if (message.displayed) {
        return (<DoneAllIcon as={'Avatar'} fontSize='small' color='primary' className={classes.checkIcons} />)
    }
    return null;
}

const ChatTyping = ({ user }) => {
    if (user.chat_state == 'composing') {
        return <TypingIndicator content={`${user.name} is typing`} />
    } else {
        return null;
    }
}

const ImageMessage = React.memo(function ImageMessage({ src, alt, onDownload }) {
    const [loading, setLoading] = useState(!imgCache.has(src))
    const [base64Data, setBase64Data] = useState(null)
    const [progress, setProgress] = useState(0);
    const [showToolbox, setShowToolbox] = useState(false)
    const [fullScreenImage, setFullScreenImage] = useState(false)
    const classes = useStyles();
    const [srcThumb, setSrcThumb] = useState(src + '?thumbnail=200');

    useEffect(() => {
        setSrcThumb(src + '?thumbnail=200')
    }, [src])

    const onLoad = async () => {
        setLoading(false);
    }

    const onProgress = async (event) => {
        let progress = event.total != 0 ? event.loaded / event.total : 0
        setProgress(p => Math.round(progress * 100));
    }

    const loadImage = async (url) => {
        const cacheStorage = await caches.open('imgCache');
        const cachedResponse = await cacheStorage.match(url);
        if (!cachedResponse || !cachedResponse.ok) {
            //     return false;
            //  }
            // if (!imgCache.has(src)) {
            setProgress(0)
            axios.get(url, {
                onDownloadProgress: onProgress,
                responseType: 'blob'
            }).then(response => {

                let reader = new window.FileReader();
                reader.readAsDataURL(response.data);
                reader.onload = function () {
                    let result = reader.result

                    //save cache
                    let xmlresp = new Response(result);
                    Object.keys(response.headers).forEach(k => {
                        xmlresp.headers.append(k, response.headers[k]);
                    })
                    cacheStorage.put(url, xmlresp);

                    // imgCache.setCache(src, result)
                    setBase64Data(result)
                    setLoading(false)
                }


            });
        } else {
            console.log('loaded from cache')
            cachedResponse.text().then(text => {
                setBase64Data(text)
                setLoading(false)
            })

        }
    }

    useEffect(() => {
        if (!_.isEmpty(srcThumb)) {
            loadImage(srcThumb);
        }
    }, [srcThumb])



    return (
        <Message.CustomContent >
            <div onMouseEnter={() => setShowToolbox(true)} onMouseLeave={() => setShowToolbox(false)}>
                <div style={{ display: loading ? 'none' : 'block' }} >
                    <div className={classes.imgTools} style={{ display: showToolbox ? 'flex' : 'none' }}>
                        {/* <IconButton className={classes.imgToolButton} onClick={()=>setFullScreenImage(true)}>
                        <SearchIcon htmlColor="#FFF" size={'large'}/>
                    </IconButton> */}
                        <IconButton
                            className={classes.imgToolButton}
                            onClick={() => onDownload(src, alt)}
                            size="large">
                            <GetAppIcon htmlColor="#FFF" size={'large'} />
                        </IconButton>
                    </div>
                    <img src={base64Data} alt={alt} width={200} onLoad={onLoad} />
                </div>
                <div style={{ display: loading ? 'block' : 'none' }} >
                    <Skeleton width={200} height={200} >

                    </Skeleton>
                    <LinearProgressWithLabel value={progress} />
                </div>
            </div>
        </Message.CustomContent >
    );
}, (prev, next) => {
    return prev.src == next.src
});

const FileMessage = React.memo(function FileMessage({ src, filename, icon = null, onDownload }) {

    const [mimeIcon, setMimeIcon] = useState(null)
    const loadDescription = async (url) => {
        let headers = (await axios.head(url)).headers;
        if (Object.hasOwn(headers, 'content-type')) {
            let mime = headers['content-type']?.split(';')[0];
            if (Object.hasOwn(MimeIcons, mime)) {
                setMimeIcon(MimeIcons[mime]);
            }
        } else {
            setMimeIcon(null);
        }
    }
    useEffect(() => {
        if (!_.isEmpty(src)) {
            loadDescription(src)
        }
    }, [src])

    return (
        <Message.CustomContent>
            <Box flexDirection='row' display={'flex'} alignItems='center'>
                {mimeIcon ?
                    <img src={mimeIcon} alt='filename' style={{ maxWidth: 50, maxHeight: 80 }} /> :
                    icon
                }
                <Typography style={{ marginLeft: 10 }}>{filename}</Typography>
                <IconButton
                    color='primary'
                    aria-label='download'
                    component='span'
                    onClick={() => onDownload(src, filename)}
                    size="large">
                    <GetAppIcon />
                </IconButton>
            </Box>
        </Message.CustomContent>
    );
}, (prev, next) => {
    return prev.src == next.src
});

const VideoMessage = React.memo(function VideoMessage({ src, filename }) {
    const playerref = useRef()

    useEffect(() => {
        document.customplayer = playerref.current
    }, [playerref.current])

    return (
        <Message.CustomContent>
            <div style={{ width: 300, maxWidth: '100%' }}>
                <Player ref={playerref} src={src}>
                    <BigPlayButton position="center" />
                </Player>
            </div>
        </Message.CustomContent>
    )
}, (prev, next) => {
    return prev.src == next.src
});

const AudioMessage = React.memo(function VideoMessage({ src, filename }) {
    return (
        <Message.CustomContent>
            <div style={{ width: 300 }}>
                <AudioPlayer
                    src={src}
                    showJumpControls={false}
                    layout='horizontal-reverse'
                    customAdditionalControls={[]} />
            </div>
        </Message.CustomContent>
    )
}, (prev, next) => {
    return prev.src == next.src
});

const MessageWithAttach = React.memo(function MessageWithAttach({ message }) {
    let oob = message.oob ? true : false;
    let file_extension = null;
    if (oob) {
        file_extension = message.oob.split('.').pop()?.toLowerCase();
    }
    let oob_image = ['jpg', 'jpeg', 'gif', 'png'].includes(file_extension)
    let word = ['doc', 'docx'].includes(file_extension);
    let video = ['mp4', 'mpg', 'avi'].includes(file_extension);
    let audio = ['mp3'].includes(file_extension);
    let filename = message.oob_desc ? message.oob_desc : message.oob.split('/').pop()

    const download = useCallback(async (src, filename) => {
        saveAs(src, filename);
    }, [])

    if (oob_image) {
        return (
            <ImageMessage src={message.oob} alt={filename} onDownload={download} />
        )
    }
    if (video) {
        return (
            <VideoMessage src={message.oob} filename={filename} />
        )
    }
    if (audio) {
        return (
            <AudioMessage src={message.oob} filename={filename} />
        )
    }
    if (word) {
        return (
            <FileMessage src={message.oob} onDownload={download} filename={filename} icon={<DescriptionIcon fontSize={'large'} />} />
        )
    }

    return (
        <FileMessage src={message.oob} onDownload={download} filename={filename} icon={<InsertDriveFileIcon fontSize={'large'} />} />
    )

}, (prev, next) => {
    return prev.oob == next.oob &&
        prev.oob_desc == next.oob_desc;
})

const TextMessage = React.memo(function TextMessage({ text }) {

    const [formatedText, setFormatedText] = useState('')

    useEffect(() => {
        let t = text.replace(/\p{Emoji_Presentation}/ug, (x) => (`<span style="font-size: 3em">${x}</span>`));
        setFormatedText(t);
    }, [text])

    return (
        <Message.CustomContent>
            <div dangerouslySetInnerHTML={{ __html: formatedText }} />
        </Message.CustomContent>
    )
}, (prev, next) => {
    return prev.text == next.text
})

function useDateReference(time) {
    const [dateReference, setDateReference] = useState('');
    useEffect(() => {
        setDateReference(moment(time).fromNow())
    }, [time])

    useInterval(() => {
        setDateReference(moment(time).fromNow())
    }, 60000)

    return dateReference
}

const MessageMemo = React.memo(({ message, showSender, divider = false }) => {
    let oob = message.oob ? true : false;

    const dateReference = useDateReference(message.sentTime);


    return (
        <React.Fragment key={message.id}>
            {divider &&
                <MessageSeparator key={message.id + '.sep'} content={moment(message.sentTime).format('dddd, DD/MM/YY')} />
            }
            <Message key={message.id} model={{ direction: message.direction, position: showSender ? 'first' : 'normal' }} avatarPosition={'cl'}>
                {
                    oob ?
                        <MessageWithAttach key={`message_attach-${message.id}`} as={'Message.CustomContent'} message={message} />
                        :
                        <TextMessage as={'Message.CustomContent'} text={message.message} />
                }
                {message.direction == 'outgoing' &&
                    <MessageCheckMark message={message} as='Avatar' />
                }
                <Message.Footer sender={message.show_from ? message.from : null} sentTime={dateReference} />
            </Message>
        </React.Fragment>
    )
}, (prev, next) => {

    return (
        prev.message.id == next.message.id &&
        prev.showSender == next.showSender &&
        prev.message.direction == next.message.direction &&
        prev.message.position == next.message.position &&
        prev.message.message == next.message.message &&
        prev.message.from == next.message.from &&
        prev.message.show_from == next.message.show_from &&
        prev.message.received == next.message.received &&
        prev.message.displayed == next.message.displayed &&
        prev.message.sentTime == next.message.sentTime &&
        prev.divider == next.divider
    )
});

const FileUploadProgress = ({ fileuploads, onFileUploadCancel }) => {
    const [fileUploadProgress, setFileUploadProgress] = useState(0)
    const [show, setShow] = useState(false)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        if (Object.keys(fileuploads).length == 0) {
            setShow(false);
            setExpanded(false);
        } else {
            let total = Object.values(fileuploads).reduce((prev, curr) => (prev + (curr.progress ? curr.progress : 0)), 0);
            let count = Object.keys(fileuploads).length;
            setFileUploadProgress(Math.round(total / count));
            if (!show) {
                setShow(true)
            }
        }
    }, [fileuploads])

    if (!show) return null;

    const formatFileSize = (bytes, decimalPoint = 2) => {
        if (bytes == 0) return '0 Bytes';
        var k = 1000,
            dm = decimalPoint || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
        <Paper square={true} variant='outlined'>
            <LinearProgressWithLabel value={fileUploadProgress} endIcon={
                <IconButton size='small' onClick={() => setExpanded(!expanded)}>
                    {expanded ?
                        <ExpandLessIcon />
                        :
                        <ExpandMoreIcon />
                    }
                </IconButton>
            } />
            <Collapse in={expanded} style={{ paddingLeft: 10 }}>
                {
                    Object.keys(fileuploads).map(fu_key => (
                        <div key={fu_key} style={{ overflow: 'hidden', maxWidth: 'calc(100% - 10px)', textOverflow: 'ellipsis' }}>
                            <LinearProgressWithLabel value={fileuploads[fu_key].progress} endIcon={
                                <IconButton size='small' onClick={() => onFileUploadCancel(fu_key)}>
                                    <CloseIcon fontSize='small' />
                                </IconButton>
                            } />
                            <Typography style={{ maxWidth: '100%', color: '#888' }} noWrap={true} variant='caption'>{fileuploads[fu_key].name}({formatFileSize(fileuploads[fu_key].size)})</Typography>
                        </div>
                    ))
                }
            </Collapse>
            <Typography>Uploading {Object.keys(fileuploads).length} files</Typography>
        </Paper>
    )
}

const ChatMessageBox = ({ user = null, onSend, onChatStateUpdate, onHistoryLoad, onFileUpload, onAttachClick, fileUploadsState, onFileUploadCancel }) => {
    const classes = useStyles();

    const [userData, setUserData] = useState({
        avatar: null,
        info: '',
        name: '',
        messagesStore: {},
        messagesOrder: [],
        id: 0,
    });

    const [emotiAnchor, setEmotiAnchor] = useState(null)

    const handleAnchorEmotiPoper = async (event) => {
        setEmotiAnchor(event.currentTarget)
    }

    const handleAnchorEmotiPoperClose = async () => {
        setEmotiAnchor(null);
        textInputRef.current.focus();
    }

    const [userInput, setUserInput] = useState({});

    // const [showToolBox, setShowToolBox] = useState(false);

    useEffect(() => {
        setUserData({
            avatar: null,
            messagesStore: {},
            messagesOrder: [],
            info: '',
            name: '',
            chat_state: null,
            last_chat_state_send: null,
            id: 0,
            ...user
        })
    }, [user])

    const handleChangeInput = async (value) => {
        updateUserInput(value);
        if (user.last_chat_state_send != 'composing') {
            onChatStateUpdate('composing')
        }
    }

    const updateUserInput = async (value) => {
        setUserInput(ui => ({
            ...ui,
            [user?.jid]: value
        }));
    }

    const addToUserInput = async (value) => {
        setUserInput(ui => ({
            ...ui,
            [user?.jid]: (ui[user?.jid] ? ui[user.jid] : '') + value
        }));
    }

    const [, cancelDebounce] = useDebounce(() => {
        if (user?.last_chat_state_send == 'composing') {
            onChatStateUpdate('paused');
        }
    }, 5000, [userInput, user]);

    const debouceBlur = _.debounce(() => {
        if (user.last_chat_state_send != 'inactive') {
            onChatStateUpdate('inactive');
        }
    }, 10000)

    const handleSend = (msg) => {
        if (onSend && _.isFunction(onSend)) {
            updateUserInput('')
            let strippedString = msg.replace(/(<([^>]+)>)/gi, "");  //strip html tags on firefox
            onSend(strippedString);
            textInputRef.current.focus();
        }
    }

    // const customPrefix = () => {
    //     return Math.random().toString().substring(2);
    // }

    // const [msgPrefixID, setMsgPrefixID] = useState(customPrefix())
    // useInterval(async () => {
    //     setMsgPrefixID(customPrefix())
    // }, 60000);


    const textInputRef = useRef();

    const onClickLoadHistory = () => {
        if (onHistoryLoad && _.isFunction(onHistoryLoad)) {
            onHistoryLoad(user.jid)
        }
    }

    const EmoticonsButtons = useMemo(() => {
        let start = 0x1F600;
        let end = 0x1F650;
        let icons_code = []
        for (let i = start; i < end; i++) {
            icons_code.push(i);
        }
        return (<>
            {
                icons_code.map((code, index) => (
                    <Button key={index} style={{ fontSize: '3em' }} variant='text' size='large' onClick={() => addToUserInput(String.fromCodePoint(code))}>{String.fromCodePoint(code)}</Button>
                ))
            }
        </>
        )

    }, [user])

    return (

        <ChatContainer style={{ width: '100%' }} >
            <div as={'ConversationHeader'} >
                <ConversationHeader>
                    <StyledBadge as={'Avatar'}
                        variant='dot'
                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        status={user?.status ? user.status : UserStatus.UNAVAILABLE}
                    >
                        <MuiAvatar as={'Avatar'} alt={user?.name} src={user?.avatar ? user.avatar : 'http://'} />
                    </StyledBadge>
                    <ConversationHeader.Content userName={userData.name} info={userData.info} />
                    <ConversationHeader.Actions>
                        <InfoButton title="Show info" />
                    </ConversationHeader.Actions>
                </ConversationHeader>
                <FileUploadProgress as={'ConversationHeader'} fileuploads={fileUploadsState} onFileUploadCancel={onFileUploadCancel} />
            </div>

            <MessageList typingIndicator={<ChatTyping user={userData} />} >
                {
                    user && (user.jid_type == 'user' || user.jid_type == 'group') && !Boolean(userData.history_load) &&
                    <Button as="Message" size='small' variant='outlined' text='Load more...' onClick={onClickLoadHistory} />
                }
                {userData.messagesOrder.filter(m => userData.messagesStore[m]?.message).map((message_id, msg_index) => {
                    let message = userData.messagesStore[message_id];
                    let show_sender =
                        msg_index == userData.messagesOrder.length - 1 ||
                        userData.messagesStore[message_id].from != userData.messagesStore[userData.messagesOrder[msg_index + 1]].from
                    let previous = (msg_index == 0)
                        ? null
                        : userData.messagesStore[userData.messagesOrder[msg_index - 1]];
                    let sameDayAsPrevious = previous != null && moment(previous.sentTime).isSame(moment(message.sentTime), 'day');

                    return (
                        <MessageMemo key={message.id} message={message} showSender={show_sender} divider={!sameDayAsPrevious} />
                    )
                }
                )}
                <Popover
                    open={Boolean(emotiAnchor)}
                    anchorEl={emotiAnchor}
                    onClose={handleAnchorEmotiPoperClose}
                    as={'Message'}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    style={{ zIndex: 1500 }}>
                    <Paper style={{ width: 400, height: 300 }}>
                        {EmoticonsButtons}
                    </Paper>
                </Popover>
            </MessageList>




            <div as={'MessageInput'}
                style={{
                    display: "flex",
                    flexDirection: "row",
                    borderTop: "1px dashed #d1dbe4"
                }} >
                <MessageInput
                    ref={textInputRef}
                    onChange={handleChangeInput}
                    value={Object.hasOwn(userInput, user?.jid) ? userInput[user.jid] : ''}
                    sendButton={false}
                    placeholder="Type message here"
                    disabled={!Boolean(user)}
                    attachButton={false}
                    onSend={handleSend} style={{
                        flexGrow: 1,
                        borderTop: 0,
                        flexShrink: "initial"
                    }} />
                <IconButton color='primary' size='small' onClick={handleAnchorEmotiPoper} disabled={!Boolean(user)}>
                    <EmojiEmotionsOutlinedIcon />
                </IconButton>
                <IconButton
                    color='primary'
                    size='small'
                    onClick={() => handleSend(Object.hasOwn(userInput, user?.jid) ? userInput[user.jid] : '')}
                    disabled={!Boolean(user)}>
                    <SendIcon />
                </IconButton>
                <IconButton color='primary' size='small' onClick={onAttachClick} disabled={!Boolean(user)}>
                    <AttachFileIcon />
                </IconButton>
                {/* <AttachmentButton onClick={onAttachClick}  /> */}
                {/* <IconButton
                    onClick={()=>alert('not yet')}
                    size='small'
                    style={{
                        fontSize: "1.2em",
                        paddingLeft: "0.2em",
                        paddingRight: "0.2em"
                    }}>
                    <MicIcon color='primary' />
                </IconButton> */}
            </div>
        </ChatContainer >

    )
}

export default ChatMessageBox;