import { Box } from "@mui/system"

const ChatContainer = ({children}) => {
return (
    <Box display='flex'>
        {children}
    </Box>
)
}

export default ChatContainer