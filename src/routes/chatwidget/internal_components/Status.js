import { Box, Button } from "@mui/material"

const Bullet = ({ status }) => {

    return (<Box sx={theme => ({
        boxSizing: 'content-box',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        position: 'relative',
        backgroundColor: theme.palette.UserStatus[status],

        // Bubble
        perspective: '200px',
        perspectiveOrigin: '50% 50%',
    })} />)
}

const Status = ({ name, status, selected, onClick }) => {
    const sx = theme => ({
        width: '100%', 
        justifyContent: "flex-start",
        backgroundColor:  selected ? '#ddf' : theme.palette.paper
    })
    return (
        <Button sx={sx} onClick={onClick} variant='text' startIcon={<Bullet status={status} />}>{name}</Button>
    )
}

export default Status