import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        UserStatus: {
            'available': '#44b700',
            'unavailable': '#a66d00',
            'away': '#fc8b00',
            'dnd': '#ec1212'
        },
        backgroundInput: 'aliceblue',
        components: {
            sidebar: {
                backgroundColor: 'aliceblue'
            },
            conversation: {
                backgroundColor: '#FFF',
                active: {
                    backgroundColor: '#d5e7f5'
                },
                hover: {
                    backgroundColor: '#C5D7E5'
                }
            },
        }
    },
    components: {
        message: {
            content: {
                backgroundColor: 'lightblue'
            }

        }
    }

});

export default theme;