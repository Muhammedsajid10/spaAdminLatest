function NoAppointment() {
  return (
     <div className="no-appointments-card">
              <div className="icon-wrapper">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 2v2M8 2v2M3 9h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9.5 15 2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="card-title">No Appointments Today</h2>
              <p className="card-description">
                Your schedule is clear for today. Book new appointments or check
                upcoming dates.
              </p>
            </div>
  );
}
export default NoAppointment;