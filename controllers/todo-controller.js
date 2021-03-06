const { ToDo } = require('../models/index.js');
const axios = require('axios')
const Mailgun = require('mailgun-js')
require('dotenv').config()

class ToDoController {
    static async createToDo(req, res, next) {
        let toDotitle;
        let description = req.body.description;
        let status = req.body.status;
        let dueDate = req.body.dueDate;
        let UserId = req.currentUser.id;

        try {

            //Bored API feature => Generate Random Activity for Title
            if (req.body.title === "bored") {
                await axios.get("http://www.boredapi.com/api/activity/")
                    .then(result => {

                        toDotitle = result.data.activity
                    })
            } else {
                toDotitle = req.body.title
            }

            let createdToDo = await ToDo.create({
                title: toDotitle,
                description,
                status,
                dueDate,
                UserId
            })

            res.status(201).json(
                {
                    title: createdToDo.title,
                    description: createdToDo.description,
                    status: createdToDo.status,
                    dueDate: createdToDo.dueDate,
                    UserId: createdToDo.UserId
                }
            )
        } catch (err) {
            next(err);
        }
    }

    static readToDo(req, res, next) {
        ToDo.findAll()
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => {
                next(err);
            })
    }

    static readToDoById(req, res, next) {
        let todoId = Number(req.params.id)

        ToDo.findByPk(todoId)
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => {
                next(err)
            })
    }

    static updateToDo(req, res, next) {
        let todoId = req.params.id
        let { title, description, status, dueDate } = req.body;


        ToDo.update({
            title,
            description,
            status,
            dueDate
        },
            {
                where: {
                    id: todoId
                },
                returning: true
            })
            .then(result => {
                let [status, todo] = result
                res.status(200).json(todo)
            })
            .catch(err => {
                next(err)
            })
    }

    static deleteToDo(req, res, next) {
        let todoId = Number(req.params.id)
        let obj;

        ToDo.findByPk(todoId)
            .then(result => {
                obj = result

                return ToDo.destroy({
                    where: {
                        id: todoId
                    }
                })
            })
            .then(result => {
                res.status(200).json(obj)
            })
            .catch(err => {
                next(err)
            })
    }

    static emailToDo(req, res, next) {
        let todoId = Number(req.params.id)
        let emailTarget = req.body.email

        ToDo.findByPk(todoId)
            .then(result => {

                let todoData = {
                    title: result.title,
                    description: result.description,
                    status: result.status,
                    dueDate: result.dueDate,
                }

               
                todoData = JSON.stringify(todoData, null, 2)
                todoData += `\n Thank you for using our application :)`

                let API_KEY = process.env.MAILGUN_API_KEY;
                let DOMAIN = process.env.MAILGUN_DOMAIN;
                let mailgun = new Mailgun({ apiKey: API_KEY, domain: DOMAIN });
                const data = {
                    from: 'mailgun@sandbox710b35b55b724cad928833d39ac6013d.mailgun.org',
                    to: emailTarget,
                    subject: `To Do Data Detail: ${result.title}`,
                    text: todoData
                };

                mailgun.messages().send(data, (error, body) => {
                    if (error) next(error)
                    else res.status(200).json(body)
                })
            })
            .catch(err => {
                next(err)
            })
    }

    static readToDoByUserId(req, res, next) {
        let currentUserId = req.currentUser.id;
        ToDo.findAll({
            where: {
                UserId: currentUserId
            }
        })
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => {
                res.send(err)
                next(err);
            })
    }
}

module.exports = ToDoController;