import { Badge, Button } from "@mui/material";
import { styled, withStyles } from "@mui/styles";

const UserStatusColorIndicator = {
    'available': '#44b700',
    'unavailable': '#a66d00',
    'away': '#fc8b00',
    'dnd': '#ec1212'
}

const StyledAvatar = ({ ...props }) => (
    <Badge sx={(theme) => ({
        margin: 1,
        '& .MuiBadge-badge': {
            backgroundColor: theme.palette.UserStatus[props.status],
            color: props => theme.palette.UserStatus[props.status],
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                // border: '1px solid currentColor',
                content: '""',
            }
        }
    })} {...props} />
)

const Bullet = ({ status }) => {

    return (<div style={{
        boxSizing: 'content-box',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        position: 'relative',
        backgroundColor: UserStatusColorIndicator[status],

        // Bubble
        perspective: '200px',
        perspectiveOrigin: '50% 50%',
    }} />)
}

const CustomStatus = ({ name, status, selected, onClick }) => {
    return (
        <Button style={{ width: '100%', justifyContent: "flex-start" }} onClick={onClick} variant='text' startIcon={<Bullet status={status} />}>{name}</Button>
    )
}

export { CustomStatus }

export default StyledAvatar;