// import { createContext, useContext } from "react";

// const CalendarContext = createContext();
// const useCalendarContext = () => useContext(CalendarContext);

// const calendarReducer = (state, action) => {
//     switch (action.type) {
//         case "setSelectedDate":
//             return {
//                 ...state,
//                 selectedDate: action.data
//             }
//         case "setShifts":
//             return {
//                 ...state,
//                 shifts: action.data
//             }
//         case "setFeaturedShift":
//             return {
//                 ...state,
//                 featuredShift: action.data
//             }
//         default: return state
//     }
// }

// export {
//     CalendarContext,
//     useCalendarContext,
//     calendarReducer,
// }