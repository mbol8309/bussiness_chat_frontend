import { Admin, EditGuesser, ListGuesser, Resource, ShowGuesser } from "react-admin"
import authProvider from "./authprovider"
import dataprovider from "./dataprovider"
import { DomainCreate, DomainEdit, DomainList, DomainShow } from "./resources/domains/DomainMethods"

const AdminRoute = () => {
    return (
        <Admin
        dataProvider={dataprovider}
        authProvider={authProvider}
        basename="/admin"
        >
            <Resource name="domains" list={DomainList} edit={DomainEdit} show={DomainShow} create={DomainCreate} />
        </Admin>)
}

export default AdminRoute