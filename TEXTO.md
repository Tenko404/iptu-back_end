| Endpoint              | HTTP Method | `admin` | `staff` | `dev` | Notes                                                                                   |
| --------------------- | ----------- | :-----: | :-----: | :---: | --------------------------------------------------------------------------------------- |
| `/api/users/login`    | POST        |   ✅    |   ✅    |  ✅   | Everyone can access the login endpoint.                                                 |
| `/api/people`         | POST        |   ✅    |   ✅    |  ✅   | Who can create new people records?                                                      |
| `/api/people/:id`     | GET         |   ✅    |   ✅    |  ✅   | Who can retrieve a person by ID?                                                        |
| `/api/people`         | GET         |   ✅    |   ✅    |  ✅   | Who can retrieve all people?                                                            |
| `/api/people/:id`     | PUT         |   ✅    |   ✅    |  ✅   | Who can update a person?                                                                |
| `/api/people/:id`     | DELETE      |   ✅    |         |  ✅   | Who can delete a person?                                                                |
| `/api/properties`     | POST        |   ✅    |   ✅    |  ✅   | Who can create new properties?                                                          |
| `/api/properties/:id` | GET         |   ✅    |   ✅    |  ✅   | Who can retrieve a property by ID?                                                      |
| `/api/properties`     | GET         |   ✅    |         |  ✅   | Who can retrieve all properties (search)?                                               |
| `/api/properties/:id` | PUT         |   ✅    |   ✅    |  ✅   | Who can update a property?                                                              |
| `/api/properties/:id` | DELETE      |   ✅    |         |  ✅   | Who can delete a property?                                                              |
| `/api/users`          | POST        |         |         |  ✅   | (Hypothetical) Who can create new users? (You don't have this yet, but you likely will) |
| `/api/users/:id`      | GET         |         |         |  ✅   | (Hypothetical) Who can retrieve a user by ID?                                           |
| `/api/users`          | GET         |         |         |  ✅   | (Hypothetical) Who can retrieve all users?                                              |
| `/api/users/:id`      | PUT         |         |         |  ✅   | (Hypothetical) Who can update a user?                                                   |
| `/api/users/:id`      | DELETE      |         |         |  ✅   | (Hypothetical) Who can delete a user?                                                   |

Notes:

- I'm thinking about creating a role called dev, it will be similar to admin, but it will have access to some features that are in WIP state for example.
