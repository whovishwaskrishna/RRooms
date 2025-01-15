import { db } from '../../../models';

export default {

    async getCityByStateId(req, res) {
        const id = req.params.id;
        const selection = {
            where : {state_id:id},
            order: [['name', 'ASC']]
        }
        const selector = Object.assign({}, selection);
        await db.cities.findAll(selector).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(400).json({ status: false, message: err.message});
        });
            
    },

    async get(req, res) {
        await db.cities.findAll({order: [['name', 'ASC']]}).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(400).json({ status: false, message: err.message});
        });
            
    },

    async getById(req, res) {
        const id = req.params.id;
        await db.cities.findOne({where: {id: id}}).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(400).json({ status: false, message: err.message});
        });
            
    },

    async create(req, res) {
        const { name, state_id, state_code, country_id, status } = req.body;
        console.log(name, state_id, state_code, country_id, status)
        await db.cities.create({name:name, state_id:state_id, state_code:state_code, country_id:country_id, status:status}).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(400).json({ status: false, message: err.message});
        });
    },

    async update(req, res) {
        const id = req.params.id;
        const { name, state_id, state_code, country_id, status } = req.body;
        await db.cities.update({name:name, state_id:state_id, state_code:state_code, country_id:country_id, status:status},  {where: {id: id}}).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(400).json({ status: false, message: err.message});
        });
    },

    async delete(req, res) {
        const id = req.params.id;
        await db.cities.destroy({where: {id: id}}).then(result => {
            return res.status(200).json({ data: result, status: true});
        })
        .catch((err) => {
            res.status(400).json({ status: false, message: err.message});
        });
    }
};