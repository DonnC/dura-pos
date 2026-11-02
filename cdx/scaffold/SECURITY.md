# Security reporting and scope

This file is a staged policy. Before public release, verify a private reporting
channel and replace this status with the actual channel and supported versions.
No mailbox or reporting service is asserted to exist here.

Do not publish vulnerabilities with merchant keys, PIN data, fiscal keys,
customer information, live transaction payloads or exploit details affecting
other businesses. If GitHub private vulnerability reporting is enabled for this
repository, use its Security reporting flow; otherwise obtain a verified private
maintainer contact before sending sensitive details.

Include affected version/platform, minimal reproduction with fictitious data,
impact, preconditions and any proposed mitigation. Never test against someone
else's shop or live merchant/fiscal systems without authorisation.

Security properties include correct business/mode isolation, authorised staff
operations, protected secrets, callback verification, nonduplicated financial
effects, integrity/recovery of records and truthful sync/fiscal/payment status.

A dedicated business Google account/app-locked phone is an owner-managed device
arrangement. An app PIN alone is not an operating-system kiosk or an access
boundary for other apps signed into the same account. See the device policy.
