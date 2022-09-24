import { Button, InputAdornment, TableCell } from '@mui/material';
import { useState } from 'react';
import { Create, Datagrid, Edit, List, Show, SimpleForm, SimpleShowLayout, TextField, TextInput, UrlField, useRecordContext, useUpdate } from 'react-admin';
import Api from '../../../../common/api';
import MuiTextField from '@mui/material/TextField';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useStopPropagation } from '../../../../common/hooks';

const TokenInput = ({ value }) => {
    const [visible, setVisible] = useState(false)

    const onTextClick = useStopPropagation()
    const changeVisible = (event) => {
        event.stopPropagation()
        setVisible(v => !v)
    } 
    return (
        <MuiTextField type={visible ? 'text' : 'password'} value={value} onClick={onTextClick} size='small' variant='outlined' InputProps={{
            endAdornment: (
                <InputAdornment position='end' onClick={changeVisible} style={{cursor:'pointer'}}>
                    {
                        visible ?
                            <VisibilityOffIcon />
                            :
                            <VisibilityIcon />
                    }
                </InputAdornment >
            )
        }} />
    )
}

const GenerateTokenButton = () => {
    const object = useRecordContext()
    const [requestedToken, setRequestedToken] = useState(null)

    const handleClick = async (event) => {
        event.stopPropagation()
        Api.generateDomainToken(object.id).then(result => {
            if (result.status !== 200) {
                throw result
            }
            if (result.data?.data?.attributes?.token) {
                setRequestedToken(result.data.data.attributes.token)
            } else {
                throw 'No token generated';
            }
        })
    }

    if (!object) return null
    return (
        requestedToken ?
            <TokenInput value={requestedToken} />
            :
            <Button variant='outlined' onClick={handleClick}>Generate Token</Button>
    )
}

export const DomainList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <UrlField source="url" />
            <TableCell>
                <GenerateTokenButton />
            </TableCell>
        </Datagrid>
    </List>
);


export const DomainEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="url" />
        </SimpleForm>
    </Edit>
);

export const DomainCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="url" />
        </SimpleForm>
    </Create>
);

export const DomainShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <UrlField source="url" />
        </SimpleShowLayout>
    </Show>
);