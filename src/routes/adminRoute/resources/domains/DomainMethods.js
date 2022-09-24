import { Create, Datagrid, DateField, DateInput, Edit, List, Show, SimpleForm, SimpleShowLayout, TextField, TextInput, UrlField } from 'react-admin';

export const DomainList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <UrlField source="url" />
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