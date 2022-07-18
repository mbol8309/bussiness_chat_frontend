import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        UserStatus: {
            'available': '#44b700',
            'unavailable': '#a66d00',
            'away': '#fc8b00',
            'dnd': '#ec1212'
        }
    }
});

export default theme;