 function submitComplaint() {


    /* ============================= */
    /* Get Form Data */
    /* ============================= */

    let name =
        document.getElementById(
            "studentName"
        ).value.trim();


    let problem =
        document.getElementById(
            "problem"
        ).value.trim();


    let location =
        document.getElementById(
            "location"
        ).value.trim();


    /* ============================= */
    /* Validate Form */
    /* ============================= */

    if (
        name === "" ||
        problem === "" ||
        location === ""
    ) {

        alert(
            "Please fill all the required fields."
        );

        return;

    }


    /* ============================= */
    /* Generate Complaint ID */
    /* ============================= */

    let complaintID =
        "CS" +
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    /* ============================= */
    /* Smart Triage */
    /* ============================= */

    let result =
        smartTriage(problem);


    /* ============================= */
    /* Create Complaint */
    /* ============================= */

    let complaint = {

        id:
            complaintID,

        name:
            name,

        problem:
            problem,

        location:
            location,

        category:
            result.category,

        priority:
            result.priority,

        department:
            result.department,

        reason:
            result.reason,

        status:
            "Pending"

    };


    /* ============================= */
    /* Save Complaint */
    /* ============================= */

    let complaints =
        JSON.parse(
            localStorage.getItem(
                "complaints"
            )
        ) || [];


    complaints.push(
        complaint
    );


    localStorage.setItem(
        "complaints",
        JSON.stringify(
            complaints
        )
    );


    /* ============================= */
    /* Success Screen */
    /* ============================= */

    document.body.innerHTML = `

        <div class="success-container">

            <div class="success-card">


                <div class="success-icon">
                    ✓
                </div>


                <h1>
                    Complaint Submitted!
                </h1>


                <p>
                    Your complaint has been successfully
                   