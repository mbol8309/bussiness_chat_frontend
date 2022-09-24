import { Admin, EditGuesser, Layout, ListGuesser, Resource, ShowGuesser } from "react-admin"
import authProvider from "./authprovider"
import dataprovider from "./dataprovider"
import { DomainCreate, DomainEdit, DomainList, DomainShow } from "./resources/domains/DomainMethods"
import { ReactQueryDevtools } from 'react-query/devtools'

const CustomLayout = props =>
    <>
        <Layout {...props} />
        <ReactQueryDevtools />
    </>

const AdminRoute = () => {
    return (
        <Admin
            layout={CustomLayout}
            dataProvider={dataprovider}
            authProvider={authProvider}
            basename="/admin"
        >
            <Resource name="domains" list={DomainList} edit={DomainEdit} show={DomainShow} create={DomainCreate} />

        </Admin>)
}

export default AdminRoute