import React from"react";
import{Navigate}from"react-router-dom";

/**
 * Kompatibilitási útvonal a régi /munkalapok linkekhez.
 * A munkalapok egyetlen aktív felülete a /workorders modul.
 */
export default function Munkalapok(){return <Navigate to="/workorders" replace/>}
