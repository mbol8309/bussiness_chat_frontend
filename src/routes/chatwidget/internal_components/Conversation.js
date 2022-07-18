
import { MarkUnreadChatAlt } from "@mui/icons-material"
import { Avatar, Badge, Typography } from "@mui/material"
import { Box } from "@mui/system"
import { useMemo } from "react"
import { UserStatus } from "../common/common"
import StyledAvatar from "./StyledAvatar"
import PropTypes from 'prop-types';

var _ = require('lodash');



const ConversationInfo = ({ value }) => {
    return (
            <Typography noWrap variant='body2' sx={{
                color: 'rgba(0,0,0,.6)',
                fontSize:'0.7em',
                alignSelf:'flex-start'
            }}>{value}</Typography>
    )
}

const ConversationName = ({ value }) => {
    return (
        <div>
            <Typography noWrap variant='body1'>{value}</Typography>
        </div>
    )
}


const Conversation = ({ children, name, lastSenderName, info, unreadCnt, active, onClick, lastActivityTime, avatar }) => {

    const conversation_style = theme => ({
        border: '1px solid #EEE', 
        height: '50px',
        padding: 1,
        alignItems: 'center',
        position: 'relative',
        backgroundColor: active ? '#d5e7f5' : theme.palette.paper,
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: '#f3f8fc'
        }
    });

    let unread = useMemo(() => {
        return !_.isNaN(_.toNumber(unreadCnt)) ? _.toNumber(unreadCnt) : null;
    }, [unreadCnt]);

    return (
        <Box display='flex' sx={conversation_style}>
            <StyledAvatar as={'Avatar'}
                variant='dot'
                overlap="circular"
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                status={UserStatus.UNAVAILABLE}
            >
                <Avatar as={Avatar} alt={name} src={'http://'} />
            </StyledAvatar>
            <Box display='flex' flexDirection={'column'}
                sx={{
                    height: '100%',
                    flexGrow: 1,
                    overflow: 'hidden',
                    marginRight: '1em',
                    position: 'relative'
                }}>
                <ConversationName value={name} />
                <ConversationInfo value={info} />

            </Box>
            {unread !== null &&
                <div style={{
                    position: 'absolute',
                    top: '0.3em',
                    color: '#fff',
                    backgroundColor: '#ec1212',
                    maxWidth: '30em',
                    fontSize: '0.75em',
                    right: '0.8em',
                    fontWeight: '600',
                    borderRadius: '0.3em',
                    padding:'0.01em 0.3em'
                }}>{unreadCnt}</div>
            }
        </Box>
    )
}
Conversation.propTypes = {
    unreadCnt: PropTypes.number
}

export default Conversation