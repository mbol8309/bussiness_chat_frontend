import { Box } from "@mui/system"

const ChatContainer = ({children, style}) => {
    const sx = theme => ({
        flexGrow: 1
    })
return (
    <Box display='flex' style={style} sx={sx}>
        {children}
    </Box>
)
}

export default ChatContainer