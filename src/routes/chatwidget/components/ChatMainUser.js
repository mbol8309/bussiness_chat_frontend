import { Avatar as MuiAvatar, Popover } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useContext, useState } from "react";
import { UserStatus, XmppApiContext } from "../common/common";
import Conversation from "../internal_components/Conversation";
import Status from "../internal_components/Status";
import StatusList from "../internal_components/StatusList";

const useStyles = makeStyles((theme) => ({
    popmenu: {
        zIndex: theme.zIndex.snackbar + 20
    }
}))
const ChatMainUser = ({ user = null }) => {

    const [openStatus, setOpenStatus] = useState(null)

    const xmpp = useContext(XmppApiContext)

    const changeStatus = (status) => {
        switch (status) {
            
            case 'available':
                if (xmpp.user_status == UserStatus.UNAVAILABLE) {
                    xmpp.login()
                } else {
                    xmpp.changeStatus('available')
                }
                break;
            case 'away':
            case 'xa':
                if (xmpp.user_status == UserStatus.UNAVAILABLE) {
                    xmpp.login()
                }
                xmpp.changeStatus('away')
                break;
            case 'dnd':
                if (xmpp.user_status == UserStatus.UNAVAILABLE) {
                    xmpp.login()
                }
                xmpp.changeStatus('dnd')
                break;
            default:
            case 'unavailable':
            
        }
        setOpenStatus(null)
    }
    const handleClickOnAvatar = (event) => {
        setOpenStatus(event.currentTarget)
    }

    const handleClose = (event) => {
        setOpenStatus(null)
    }

    return (
        <>
            <Conversation
                name={user?.name}
                info={user?.status}
                onClick={handleClickOnAvatar}
                avatar={<MuiAvatar alt={user?.name} src={user?.avatar ? user.avatar : 'http://'} />}
            >
                {/* <StyledAvatar as={'Avatar'}
                    variant='dot'
                    overlap="circular"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    status={user?.status ? user.status : UserStatus.UNAVAILABLE}
                >
                    
                </StyledAvatar> */}
                {/* <Avatar src={user?.avatar ? user.avatar : noimage} name={user?.name} status={user?.status} /> */}
            </Conversation>
            <Popover
                anchorEl={openStatus}
                open={Boolean(openStatus)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                style={{ zIndex: 2000 }}
            >
                <StatusList selected={user?.status ? user.status : 'unavailable'} onChange={changeStatus} >
                    <Status size="lg" status="available" name="Available" />
                    {/* <Status size="lg" status="eager" name="Eager" /> */}
                    <Status size="lg" status="away" name="Away" />
                    <Status size="lg" status="dnd" name="Dnd" />
                    {/* <Status size="lg" status="invisible" name="Invisible" /> */}
                    <Status size="lg" status="unavailable" name="Offline" />
                </StatusList>
            </Popover>
        </>
    )
}

export default ChatMainUser