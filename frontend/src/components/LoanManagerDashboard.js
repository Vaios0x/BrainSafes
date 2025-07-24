import React, { useState } from "react";
import { useLoanManager } from "../hooks/useLoanManager";

export default function LoanManagerDashboard({ contractAddress }) {
  const {
    requestLoan,
    fundLoan,
    repayLoan,
    markDefault,
    liquidateLoan,
    getLoanStatus,
    loading,
    error
  } = useLoanManager(contractAddress);

  const [amount, setAmount] = useState("");
  const [interest, setInterest] = useState("");
  const [duration, setDuration] = useState("");
  const [loanId, setLoanId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [status, setStatus] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    const res = await requestLoan(amount, interest, duration);
    alert(res.success ? `Préstamo solicitado. Tx: ${res.txHash}` : `Error: ${res.error}`);
  };

  const handleFund = async (e) => {
    e.preventDefault();
    const res = await fundLoan(loanId);
    alert(res.success ? `Préstamo fondeado. Tx: ${res.txHash}` : `Error: ${res.error}`);
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    const res = await repayLoan(loanId, repayAmount);
    alert(res.success ? `Préstamo repagado. Tx: ${res.txHash}` : `Error: ${res.error}`);
  };

  const handleMarkDefault = async (e) => {
    e.preventDefault();
    const res = await markDefault(loanId);
    alert(res.success ? `Préstamo marcado en default. Tx: ${res.txHash}` : `Error: ${res.error}`);
  };

  const handleLiquidate = async (e) => {
    e.preventDefault();
    const res = await liquidateLoan(loanId);
    alert(res.success ? `Préstamo liquidado. Tx: ${res.txHash}` : `Error: ${res.error}`);
  };

  const handleGetStatus = async (e) => {
    e.preventDefault();
    const s = await getLoanStatus(loanId);
    setStatus(s);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Gestión de Préstamos</h2>
      <form onSubmit={handleRequest}>
        <h3>Solicitar Préstamo</h3>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto" />
        <input value={interest} onChange={e => setInterest(e.target.value)} placeholder="Interés" />
        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duración (segundos)" />
        <button type="submit" disabled={loading}>Solicitar</button>
      </form>
      <hr />
      <form onSubmit={handleFund}>
        <h3>Fondear Préstamo</h3>
        <input value={loanId} onChange={e => setLoanId(e.target.value)} placeholder="Loan ID" />
        <button type="submit" disabled={loading}>Fondear</button>
      </form>
      <form onSubmit={handleRepay}>
        <h3>Repagar Préstamo</h3>
        <input value={loanId} onChange={e => setLoanId(e.target.value)} placeholder="Loan ID" />
        <input value={repayAmount} onChange={e => setRepayAmount(e.target.value)} placeholder="Monto a repagar" />
        <button type="submit" disabled={loading}>Repagar</button>
      </form>
      <form onSubmit={handleMarkDefault}>
        <h3>Marcar Default</h3>
        <input value={loanId} onChange={e => setLoanId(e.target.value)} placeholder="Loan ID" />
        <button type="submit" disabled={loading}>Marcar Default</button>
      </form>
      <form onSubmit={handleLiquidate}>
        <h3>Liquidar Préstamo</h3>
        <input value={loanId} onChange={e => setLoanId(e.target.value)} placeholder="Loan ID" />
        <button type="submit" disabled={loading}>Liquidar</button>
      </form>
      <form onSubmit={handleGetStatus}>
        <h3>Consultar Estado</h3>
        <input value={loanId} onChange={e => setLoanId(e.target.value)} placeholder="Loan ID" />
        <button type="submit" disabled={loading}>Consultar</button>
        {status !== null && <div>Estado actual: {status}</div>}
      </form>
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
    </div>
  );
} 