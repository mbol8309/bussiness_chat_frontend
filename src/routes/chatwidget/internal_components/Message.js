import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { grey } from '@mui/material/colors'
import MessageTextContent from "./MessageTextContent";

const Message = ({ message, footerSender, footerSentTime }) => {

    const msg_type = message?.type ?
        message.type : 'text'
    let oob = message.oob ? true : false;

    const dateReference = 'now' //useDateReference(message.sentTime);

    const direction = message.direction === 'incoming' ? 1 : 0

    const sx_content = (theme) => ({
        backgroundColor: theme.components.message.content.backgroundColor,
        borderRadius: direction ?
            `0 10px 10px 0` :
            `10px 0 0 10px`,
        maxWidth: '50%',
        marginRight: direction ? 'auto' : 0,
        marginLeft: direction ? 0 : 'auto',
        flexGrow: 1,
        padding: 1,
        width: '100%',
        textAlign: direction ? 'left' : 'right'

    })

    const sx_root = (theme) => ({
        display: 'flex',
        flexDirection: 'column',
        width: 'auto',
        margin: 1,
    })

    const sx_footer = (theme) => ({
        alignSelf: 'flex-end',
        color: grey[500],
        marginRight: direction ? 'auto' : 0,
        marginLeft: direction ? 0 : 'auto',
    })

    return (
        <Box sx={sx_root} >
            <Box key={message.id} sx={sx_content}>
                {msg_type === 'text' &&
                    <MessageTextContent text={message.message} />
                }
            </Box>
            {(footerSender || footerSentTime) &&
                <Box sx={sx_footer}>
                    <Typography variant='body2'>{footerSender} {footerSentTime}</Typography>
                </Box>
            }
        </Box>

    )
}

export default Message