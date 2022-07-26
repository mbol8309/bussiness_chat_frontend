import { Info as InfoIcon } from "@mui/icons-material"
import { Box, IconButton } from "@mui/material"
import Conversation from "./Conversation"

const ConversationHeader = ({ actions, ...props }) => {
    return (
        <Box display='flex'>
            <Conversation {...props}
                adds={actions} />

        </Box>
    )
}

export default ConversationHeader