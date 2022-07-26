import { Box } from "@mui/material"

const Sidebar = ({children}) => {

    const sx = theme => ({
        backgroundColor: theme.palette.components.sidebar.backgroundColor
    })
    return (
        <Box display='flex' flexDirection='column' sx={sx}>
            {children}
        </Box>
    )
}

export default Sidebar