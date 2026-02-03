const EventModel = require('../models/eventModel');
const { generateResponse, paginateResults } = require('../utils/helpers');

const EventController = {
  async getAllEvents(req, res, next) {
    try {
      const { category, type, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const filters = {};
      if (category) filters.category = category;
      if (type) filters.type = type;

      const events = await EventModel.findAll(filters, parseInt(limit), offset);
      const total = await EventModel.getCount(filters);

      const eventsWithStatus = events.map(event => ({
        ...event,
        is_registration_open: event.is_active && 
                              new Date(event.registration_deadline) > new Date() &&
                              (!event.max_participants || event.current_registrations < event.max_participants)
      }));

      res.json(
        generateResponse(true, 'Events fetched successfully', 
          paginateResults(eventsWithStatus, page, limit, total)
        )
      );
    } catch (error) {
      next(error);
    }
  },

  async getEventById(req, res, next) {
    try {
      const { eventId } = req.params;

      const event = await EventModel.findById(eventId);

      if (!event) {
        return res.status(404).json(
          generateResponse(false, 'Event not found')
        );
      }

      const isRegistrationOpen = event.is_active && 
                                 new Date(event.registration_deadline) > new Date() &&
                                 (!event.max_participants || event.current_registrations < event.max_participants);

      res.json(
        generateResponse(true, 'Event fetched successfully', {
          ...event,
          is_registration_open: isRegistrationOpen
        })
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = EventController;
