import { Close as CloseIcon } from "@mui/icons-material"
import { Box, InputAdornment, TextField } from "@mui/material"

const Search = ({ placeholder, value, onChange, onClearClick }) => {
    //placeholder="Search..." value={searchText} onChange={(value) => setSearchText(value)} onClearClick={() => setSearchText('')}

    const box_sx = theme => ({
        padding: 0.1,
        margin: 1
    })
    const txt_sx = theme => ({
        borderRadius: 20,
        backgroundColor: theme.palette.backgroundInput
    })

    const input_sx = theme => ({
        padding: '0.5em 1em 0.5em 1em',
    })

    const handleChange = async (event) => {
        onChange && onChange(event.target.value)
    }
    
    const handleClear = async (event) => {
        onChange && onChange('');
    }
    return (
        <Box sx={box_sx}>
            <TextField
            placeholder={placeholder}
                InputProps={
                    { sx: txt_sx,
                        endAdornment: (
                            
                            <InputAdornment position="start">
                              <CloseIcon sx={{
                                opacity: value ? 1 : 0,
                                cursor: 'pointer'
                              }}
                              onClick={handleClear}/>
                            </InputAdornment>
                          ), }
                }
                inputProps={
                    { sx: input_sx }
                } variant='outlined' size='small' value={value} fullWidth={true} onChange={handleChange} />
        </Box>
    )
}

export default Search