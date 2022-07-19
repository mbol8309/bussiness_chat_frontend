import { Box } from "@mui/material"

const StatusList = ({ children, onChange, selected }) => {
    const sx = theme => ({
        padding: 1
    })

    const onClick = async (status) => {
        if (status !== selected){
            onChange(status)
        }
    }

    return (
        <Box sx={sx} display='flex' flexDirection='column'>
            {children.map(C => (
                {
                    ...C,
                    props: {
                        ...C.props,
                        key: C.props.status,
                        selected: C.props.status === selected,
                        onClick: ()=>onClick(C.props.status)
                    }
                }
            ))}</Box>
    )
}
export default StatusList