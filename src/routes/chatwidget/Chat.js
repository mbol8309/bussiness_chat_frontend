// import { StyledEngineProvider } from "@mui/material";
import { ThemeProvider } from '@mui/material/styles'
import theme from "./common/theme";
import XmppChat from "./components/XmppChat";

const Chat = () => {
    return (
        // <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <XmppChat />
            </ThemeProvider>
        // </StyledEngineProvider>
    );

}

export default Chat;