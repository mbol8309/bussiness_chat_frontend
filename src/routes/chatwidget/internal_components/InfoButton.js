import { Info as InfoIcon } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"

const InfoButton = ({ title, onClick }) => {
    return (
        <Tooltip title={title}>
            <IconButton onClick={onClick}>
                <InfoIcon />
            </IconButton>
        </Tooltip>
    )
}

export default InfoButton