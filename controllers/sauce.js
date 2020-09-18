const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce créée !' }))
        .catch(error => res.status(400).json({ error }));
}

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
}

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
}

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?  /* check if a req.file already exist */
        {                           /* if yes then recover the informations of the req and indicate the path of the image */
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };        /* if not then set the sauceObject as it is in the req */
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

exports.likeOrDislikeASauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            switch (req.body.like) {
                case 1: /* user likes the sauce */
                    sauce.likes++;
                    sauce.usersLiked.push(req.body.userId);
                    if (sauce.usersDisliked.includes(req.body.userId)) {
                        sauce.dislikes--;
                        const userIndex = sauce.usersDisliked.indexOf(req.body.userId);
                        sauce.usersDisliked.splice(userIndex, 1);
                    }
                    break;
                case 0: /* user nor likes or dislikes the sauce */
                    if (sauce.usersLiked.includes(req.body.userId)) {
                        sauce.likes--;
                        let userIndex = sauce.usersLiked.indexOf(req.body.userId);
                        sauce.usersLiked.splice(userIndex, 1);
                    }
                    if (sauce.usersDisliked.includes(req.body.userId)) {
                        sauce.dislikes--;
                        let userIndex = sauce.usersDisliked.indexOf(req.body.userId);
                        sauce.usersDisliked.splice(userIndex, 1);
                    }
                    break;
                case -1: /* user dislikes the sauce */
                    sauce.dislikes++;
                    sauce.usersDisliked.push(req.body.userId);
                    if (sauce.usersLiked.includes(req.body.userId)) {
                        sauce.likes--;
                        const userIndex = sauce.usersLiked.indexOf(req.body.userId);
                        sauce.usersLiked.splice(userIndex, 1);
                    }
                    break;
                default: /* if none of the cases above are possible return an error with status 405 "Method Not Allowed" */
                    res.status(405).json({ error });
                    break;
            }
            sauce.updateOne({ likes: sauce.likes, dislikes: sauce.dislikes, usersLiked: sauce.usersLiked, usersDisliked: sauce.usersDisliked })
                .then(() => res.status(200).json({ message: 'Likes / dislikes de la sauce mis à jour !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};