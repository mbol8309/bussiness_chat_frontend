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



export default StyledAvatar;