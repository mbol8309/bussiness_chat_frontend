import { Box } from "@mui/material"

const ConversationList = ({children}) => {
    const sx =theme => ({
        // border: '1px solid #eef',
        flexGrow: 1,
        height:'100%'
    })
    return (
        <Box display='flex' flexDirection={'column'}
        sx={sx}>
            {children}
        </Box>
    )
}

export default ConversationList