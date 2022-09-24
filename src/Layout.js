import { Layout } from "react-admin";
import { ReactQueryDevtools } from 'react-query/devtools';

export const AdminLayout = (props) => (
    <>
        <Layout {...props} />
        <ReactQueryDevtools initialIsOpen={false}/>
    </>
)