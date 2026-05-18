from ortools.sat.python import cp_model

def generate_schedule(services, people, role):
    model = cp_model.CpModel()

    assignments = {}

    for s in services:
        for p in people:
            assignments[(s["id"], p["id"])] = model.NewBoolVar(
                f"s{s['id']}_p{p['id']}"
            )

        model.Add(
            sum(assignments[(s["id"], p["id"])] for p in people) == 1
        )

    # fairness constraint
    for p in people:
        model.Add(
            sum(assignments[(s["id"], p["id"])] for s in services) <= 2
        )

    solver = cp_model.CpSolver()
    solver.Solve(model)

    results = []
    for (s_id, p_id), var in assignments.items():
        if solver.Value(var):
            results.append({
                "service_id": s_id,
                "person_id": p_id,
                "role": role
            })

    return results
