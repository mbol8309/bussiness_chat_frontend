
import { Typography } from "@mui/material"
import { blue, grey } from "@mui/material/colors"
import { Box } from "@mui/system"
import './TypingIndicator.scss'

const TypingIndicator = ({ content }) => {
    const sx_root = (theme) => ({
        display: 'flex',
        flexDirection: 'row',
        height:30,
        width:'max-content',
        top:-30,
        alignItems:'center'
    })

    const sx_dot = (theme) => ({
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: blue[500],
        margin:0.2,
    })

    const sx_content = (theme) => ({
        color:grey[700],
        marginLeft:1,
    })


    return (
        <Box sx={sx_root} as='TypingIndicator'>
            <Box sx={sx_dot} className='typingIndicatorDot' />
            <Box sx={sx_dot} className='typingIndicatorDot'/>
            <Box sx={sx_dot} className='typingIndicatorDot'/>
            <Typography variant={'body2'} sx={sx_content}>{content}</Typography>
        </Box>
    )
}

export default TypingIndicator