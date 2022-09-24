import jsonapiClient from "ra-jsonapi-client";
import { backend_host } from '../../../common/globals';

const settings = {
    headers: {
        // Authorization: 'Bearer ' + localStorage.getItem(tokenNameValue)
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
    },
    onerror: (e)=>{
        console.log(e)
    }
}

const dataProvider = jsonapiClient(backend_host+'/api/v1', settings);


export default dataProvider