import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import baseURL from "../../utils/baseUrl";

import { useGlobalContext } from "../../utils/globalUtils";
import { useHandleForm } from "../../utils/formUtils";
import { useModalContext } from "../../utils/modalUtils";
import Form from "./Form";
import { ButtonPrimary } from "../root/Buttons";

import {
    TextField, Alert, Stack,
    FormControl, Select, InputLabel, MenuItem
} from "@mui/material";
import TimePicker from "../DateTimePicker";
import dayjs from "dayjs";


export const EditShiftForm = () => {
    const { store, dispatch } = useGlobalContext();
    const { modalDispatch } = useModalContext();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Set the initial form and alert state
    const initialState = {
        inputs: {
            carer: store.selectedShift.carer._id,
            shiftStartTime: dayjs(new Date(store.selectedShift.shiftStartTime)).$d,
            shiftEndTime: dayjs(new Date(store.selectedShift.shiftEndTime)).$d,
            coordinatorNotes: store.selectedShift.coordinatorNotes
        },
        errors: []
    }
    const [form, setForm] = useHandleForm(initialState);
    const [alerts, setAlerts] = useState([]);
    const [carers, setCarers] = useState([]);

    // Get the carers for the selected patient
    const getCarers = useCallback(() => {
        fetch(`${baseURL}/patient/${store.selectedPatient._id}`, {
            credentials: "include"
        }).then((response => response.json()))
            .then((data) => {
                setCarers(data.patient.carers);
                setIsLoading(false);
            });
    }, [store.selectedPatient]);

    useEffect(() => {
        getCarers();
    }, [getCarers]);

    // Handle carer selection
    const selectCarer = useCallback((event) => {
        setForm({
            type: "setForm",
            name: "carer",
            value: event.target.value
        });
    }, [setForm]);

    // Handle time selection
    const setShiftTime = useCallback((pos, newStartTime) => {
        setForm({
            type: "setForm",
            name: `shift${pos}Time`,
            value: newStartTime.$d
        })
    }, [setForm]);

    // Update shifts after successfully posting new shift
    const updateShifts = useCallback((shift) => {
        // Update patient shifts from the database
        fetch(`${baseURL}/shift/${store.selectedPatient._id}`, {
            credentials: "include"
        }).then(response => response.json())
            .then((shifts) => {
                dispatch({
                    type: "setShifts",
                    data: shifts
                });

                // Set the updated shift as the selected shift
                dispatch({
                    type: "setSelectedShift",
                    data: shifts[shifts.length - 1]
                });

                // Show success alert
                setAlerts(prev => [...prev, `The shift was successfully updated.`]);

                // Finished loading
                setIsLoading(false);
            });
    }, [dispatch, store.selectedPatient]);

    // Close the modal and open the shift details drawer with the new shift
    const manageShift = useCallback(() => {
        modalDispatch({
            type: "close",
            data: "modal"
        });
        modalDispatch({
            type: "open",
            data: "drawer"
        });
        navigate("/calendar");
    }, [modalDispatch, navigate]);

    // console.log(form);

    return isLoading ? null : (
        <>
            <Form form={form}
                setForm={setForm}
                legend="New shift details"
                buttonText="Update shift"
                postURL={`/shift/${store.selectedShift._id}`}
                method="PUT"
                callback={updateShifts}
            >
                <label htmlFor="shiftStartTime" style={{ display: "none" }}>Shift Start Time</label>
                <label htmlFor="shiftEndTime" style={{ display: "none" }}>Shift End Time</label>
                <Stack spacing={2} sx={{ mt: 2, mb: 2 }}>
                    <TimePicker label="Shift Start Time"
                        inputProps={{ name: "shiftStartTime", required: true }}
                        time={form.inputs.shiftStartTime}
                        setTime={setShiftTime}
                    />
                    <TimePicker label="Shift End Time"
                        inputProps={{ name: "shiftEndTime", required: true }}
                        name="time-picker-end"
                        time={form.inputs.shiftEndTime}
                        setTime={setShiftTime}
                    />
                </Stack>
                <label htmlFor="carerID-input" style={{ display: "none" }}>Carer</label>
                <FormControl fullWidth>
                    <InputLabel id="carer-select">Select Carer</InputLabel>
                    <Select
                        labelId="carer-select"
                        id="carer-select"
                        label="Select Carer"
                        required
                        mui="Select"
                        value={form.inputs.carer}
                        name="carer"
                        onChange={selectCarer}
                        inputProps={{ id: "carerID-input" }}
                    >
                        {carers.map(carer => {
                            return (
                                <MenuItem value={carer._id} key={carer._id}>
                                    {`${carer.firstName} ${carer.lastName}`}
                                </MenuItem>
                            )
                        })}
                    </Select>
                </FormControl>
                <TextField multiline
                    minRows={3}
                    label="Coordinator Notes"
                    id="coordinator-notes"
                    type="text"
                    name="coordinatorNotes"
                    placeholder="Some things to take note of during this shift are..."
                    mui="TextField" />
            </Form>
            {/* Display alerts */}
            {alerts.length > 0 ? (
                <div>
                    {alerts.map((alert, index) => {
                        return (
                            <Alert severity="success" key={index}>
                                {alert}
                            </Alert>
                        );
                    })}
                    < br />
                    <div className="journey-options">
                        <ButtonPrimary onClick={manageShift}>
                            Manage shift
                        </ButtonPrimary>
                    </div>
                </div>
            ) : (
                null
            )}
        </>
    )
}

export default EditShiftForm;
