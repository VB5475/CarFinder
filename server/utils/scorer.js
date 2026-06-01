/**
 * @param {object} answers - { budget_lakh, fuel_type, transmission, seats, use_cases[], body_type }
 * @param {object[]} cars
 * @returns {object[]}
 */
function recommendCars(answers, cars) {
    const budget = Number(answers.budget_lakh);
    //   const requiredSeats = Number(answers.seats ?? answers.seat ?? 0);
    const userCases = (answers.use_cases || answers.usecases || []).map((t) =>
        String(t).toLowerCase()
    );

    const strict = cars.filter((car) =>
        passesHardFilters(car, answers, { relaxFuel: false, relaxBody: false })
    );

    if (strict.length === 0) {
        const relaxedPool = cars.filter((car) =>
            passesHardFilters(car, answers, { relaxFuel: true, relaxBody: true })
        );
        return rankCars(relaxedPool, answers, userCases, budget)
            .slice(0, 3)
            .map((item) => ({ ...item, relaxed: true }));
    }

    return rankCars(strict, answers, userCases, budget).slice(0, 5);
}

function passesHardFilters(car, answers, { relaxFuel, relaxBody }) {
    const budget = Number(answers.budget_lakh);
    const requiredSeats = Number(answers.seats ?? answers.seat ?? 0);

    if (budget && car.price_lakh > budget) return false;
    if (requiredSeats && car.seats < requiredSeats) return false;

    const fuel = answers.fuel_type;
    if (!relaxFuel && fuel && fuel !== "any" && car.fuel_type !== fuel) {
        return false;
    }

    const body = answers.body_type;
    if (!relaxBody && body && body !== "any" && car.body_type !== body) {
        return false;
    }

    const transmission = answers.transmission;
    if (transmission && transmission !== "any" && car.transmission !== transmission) {
        return false;
    }

    return true;
}

function rankCars(pool, answers, userCases, budget) {
    return pool
        .map((car) => {
            const { score, match_reasons } = scoreCar(car, userCases, budget);
            return { ...car, score, match_reasons };
        })
        .sort((a, b) => b.score - a.score);
}

function scoreCar(car, userCases, budget) {
    let score = 0;
    const match_reasons = [];

    const overlap = userCases.filter((tag) =>
        (car.usecases || []).map((u) => u.toLowerCase()).includes(tag)
    );
    if (overlap.length > 0) {
        const pts = overlap.length * 3;
        score += pts;
        match_reasons.push(
            `Matches your priorities: ${overlap.join(", ")} (+${pts} pts)`
        );
    }

    if (car.safety_rating) {
        score += car.safety_rating;
        match_reasons.push(`${car.safety_rating}-star safety rating (+${car.safety_rating} pt)`);
    }

    if (car.mileage_kmpl != null) {
        const mileagePts = Math.floor(car.mileage_kmpl / 5);
        if (mileagePts > 0) {
            score += mileagePts;
            match_reasons.push(`Fuel efficiency ${car.mileage_kmpl} kmpl (+${mileagePts} pts)`);
        }
    }

    if (budget && car.price_lakh < budget * 0.8) {
        score += 1;
        match_reasons.push(`Comfortably under budget (+1 pt)`);
    }

    return { score, match_reasons };
}

module.exports = { recommendCars };
