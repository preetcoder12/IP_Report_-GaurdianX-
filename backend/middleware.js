import RateLimiterFlexi from "rate-limiter-flexible";

const ratelimiter = new RateLimiterFlexi.RateLimiterMemory({
    points: 3,
    duration: 10
})

export const ratelimitermiddleware = (req, res, next) => {
    ratelimiter.consume(req.ip)
        .then(() => {
            next();
        }).catch(() => {
            res.status(429).send("rate limit exceeded")
        })
}
