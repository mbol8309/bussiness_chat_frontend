



import { AttachFile as AttachFileIcon, EmojiEmotionsOutlined as EmojiEmotionsOutlinedIcon, Send as SendIcon } from "@mui/icons-material"
import { IconButton, TextField } from "@mui/material"
import { Box } from "@mui/system"
import { forwardRef } from "react"



/*
<MessageInput
                    ref={textInputRef}
                    onChange={handleChangeInput}
                    value={Object.hasOwn(userInput, user?.jid) ? userInput[user.jid] : ''}
                    sendButton={false}
                    placeholder="Type message here"
                    disabled={!Boolean(user)}
                    attachButton={false}
                    onSend={handleSend} style={{
                        flexGrow: 1,
                        borderTop: 0,
                        flexShrink: "initial"
                    }} />
*/

const MessageInput = forwardRef(({ onChange, value, sendButton, placeholder, disabled, attachButton, onSend }, ref) => {
    const box_sx = theme => ({
        padding: 0.1,
        margin: 1,
        display: 'flex',
        flexDirection: 'row',
        flexGrow: 1
    })
    const txt_sx = theme => ({
        borderRadius: 5,
        backgroundColor: theme.palette.backgroundInput,
        // flexGrow:1
    })

    const input_sx = theme => ({
        padding: '0.5em 1em 0.5em 1em',
        // flexGrow:1
    })

    const tools_sx = theme => ({
        alignSelf: 'flex-end'
    })

    const handleChange = async (event) => {
        onChange && onChange(event.target.value)
    }

    const onKeyDown = async (e) => {
        if (e.key === "Enter") {
            if (!e.ctrlKey) {
                console.log(e.target.value)
                e.preventDefault()
                return true
            }
            
            e.ctrlKey = false
            return e;
        }
    }

    return (
        <Box sx={box_sx}>
            <TextField
                placeholder={placeholder}
                InputProps={
                    {
                        sx: txt_sx,
                        // endAdornment: (

                        //     <InputAdornment position="start">
                        //       <CloseIcon sx={{
                        //         opacity: value ? 1 : 0,
                        //         cursor: 'pointer'
                        //       }}
                        //       onClick={handleClear}/>
                        //     </InputAdornment>
                        //   ), 
                    }
                }
                inputProps={
                    { sx: input_sx }
                } variant='outlined'
                size='small'
                value={value}
                fullWidth={true}
                multiline
                maxRows={5}
                minRows={1}
                disabled={disabled}
                onChange={handleChange}
                onKeyDown={onKeyDown} />
            <Box display='flex' sx={tools_sx}>
                <IconButton
                    color='primary'
                    size='small'
                    // onClick={handleAnchorEmotiPoper} 
                    disabled={disabled}>
                    <EmojiEmotionsOutlinedIcon />
                </IconButton>
                <IconButton
                    color='primary'
                    size='small'
                    // onClick={() => handleSend(Object.hasOwn(userInput, user?.jid) ? userInput[user.jid] : '')}
                    disabled={disabled}>
                    <SendIcon />
                </IconButton>
                <IconButton
                    color='primary'
                    size='small'
                    // onClick={onAttachClick} 
                    disabled={disabled}>
                    <AttachFileIcon />
                </IconButton>
            </Box>
        </Box>
    )
})

export default MessageInput