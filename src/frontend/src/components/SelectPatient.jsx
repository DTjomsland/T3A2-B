import { useEffect, useCallback } from "react";
import { useGlobalState } from "../utils/globalStateContext";
import { useNavigate, Link } from "react-router-dom";

const Patient = ({ patient }) => {
    const { dispatch } = useGlobalState();
    const { _id, firstName, lastName } = patient;
    const navigate = useNavigate();

    function selectPatient(event) {
        dispatch({
            type: "setSelectedPatientById",
            data: event.currentTarget.id
        });
        // Redirect to calendar after selecting a patient
        navigate("/calendar");
    }

    return (
        <div id={_id} className="patient" onClick={selectPatient}>
            <div className="icon">👤</div>
            <div className="name">{firstName} {lastName}</div>
            <div className="shift">Upcoming shift: dd/mm/yyyy</div>
        </div>
    );
}

const SelectPatient = () => {
    const { store, dispatch } = useGlobalState();

    // Fetch the list of patients for the logged-in user
    const getPatients = useCallback(async () => {
        // console.log(`fetching patients...`);
        fetch("http://localhost:4000/user", {
            credentials: "include"
        }).then(response => response.json())
            .then(patients => {
                dispatch({
                    type: "setPatients",
                    data: patients
                });
            }).catch(error => console.error(error.message));;
    }, [dispatch]);

    useEffect(() => {
        getPatients();
    }, [getPatients]);

    return (
        <>
            <h1>Hi, {store.user}</h1>
            <h2>Select a patient</h2>
            {store.patients && store.patients.carer.length > 0 ? (
                <section>
                    <h3>Caring for</h3>
                    {store.patients.carer.map(patient => (
                        <Patient patient={patient} key={patient._id} />
                    ))}
                </section>
            ) : null}
            {store.patients && store.patients.coordinator.length > 0 ? (
                <section>
                    <h3>Coordinating for</h3>
                    {store.patients.coordinator.map(patient => (
                        <Patient patient={patient} key={patient._id} />
                    ))}
                </section>
            ) : null}

            <Link to={"/add-patient"}><button className="button-action">
                Add patient
            </button></Link>
        </>
    );
}

export default SelectPatient