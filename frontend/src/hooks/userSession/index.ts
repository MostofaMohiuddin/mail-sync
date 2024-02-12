// import  { createContext, useContext, useState } from 'react';
// import * as api from '../../api/User';

// const SessionContext = createContext(null);

// export const SessionProvider = ({ children }) => {
//   const [loading, setLoading] = useState(false);
//   const [user, setUser] = useState(null);
//   const accessToken = localStorage.getItem('access_token');
//   const refreshToken = localStorage.getItem('refresh_token');

//   const getUser = async () => {
//     setLoading(true);
//     const { response } = await api.getUser();
//     setLoading(false);
//     setUser(response?.data);
//   };

//   return (
//     <SessionContext.Provider value={{ loading, accessToken, refreshToken, user, getUser }}>
//       {children}
//     </SessionContext.Provider>
//   );
// };

// export const useSession = () => {
//   return useContext(SessionContext);
// };
