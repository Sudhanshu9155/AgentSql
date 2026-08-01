export function success(res, payload, status = 200) {
  return res.status(status).json(payload);
}

export function error(res, message, status = 500) {
  return res.status(status).json({ message });
}
