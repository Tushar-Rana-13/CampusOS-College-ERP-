import axios from 'axios' ;

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers:{
        'Content-Type' : 'application/json',
    },
});

API.interceptors.request.use(
    (config) => {
        const storedUser = localStorage.getItem('campusos_user') ;
        if(storedUser) {
            try{
                const{token} = JSON.parse(storedUser) ;
                if(token) {
                    config.headers.Authorization = `Bearer ${token}` ;
                }
            } catch(error) {
                console.error('Error parsing stored user:', error) ;
            }
        }
        return config ;
    },
    (error) => Promise.reject(error)
);

API.interceptors.response.use(
    (response) => response ,
    (error) => {
        if(error.response && error.response.status == 401) {
            localStorage.removeItem('campusos_user') ;

            if(window.location.pathname !== '/login') {
                window.location.href = '/login' ;
            }
        }
        return Promise.reject(error) ;
    }
) ;

export default API ;