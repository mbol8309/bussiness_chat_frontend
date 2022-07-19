import { Box } from "@mui/material"

const MessageSeparator = ({}) => {
    const sx = theme => ({
        backgroundColor: '#aaf',
        height:'1px',
        flexGrow: 1
    });

    return (
        <Box sx={sx}></Box>
    )
}
export default MessageSeparator