import { Box, Typography } from "@mui/material"
import { grey } from "@mui/material/colors";

const MessageSeparator = ({ content }) => {
    const sx_line = theme => ({
        backgroundColor: '#aaf',
        height: '1px',
        flexGrow: 1
    });

    const sx_root = theme => ({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    });
    const sx_content = theme => ({
        marginLeft: 1,
        marginRight: 1,
        color: grey[700]
    });

    return (
        <Box sx={sx_root}>
            <Box sx={sx_line} />
            <Box sx={sx_content}>
                <Typography variant={'body2'}>{content}</Typography>
            </Box>
            <Box sx={sx_line} />
        </Box>
    )
}
export default MessageSeparator