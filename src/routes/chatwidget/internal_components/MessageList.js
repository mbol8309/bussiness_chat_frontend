import { Box, height } from "@mui/system"

const MessageList = ({ children, typingIndicator }) => {
    const sx_root = (theme) => ({
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position:'relative'
    })
    const sx_typing = (theme) => ({
        position:'absolute',
        bottom:0
    })

    return (
        <Box sx={sx_root}>
            {children}
            {typingIndicator &&
                <Box sx={sx_typing}>
                    {typingIndicator}
                </Box>
            }
        </Box>
    )
}

export default MessageList