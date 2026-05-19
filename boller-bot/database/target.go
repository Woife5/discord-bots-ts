package database

import (
	"context"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const targetKey = "target"

// Target holds the stalker-mode target user information.
type Target struct {
	UserID   string `bson:"userId"`
	UserName string `bson:"userName"`
}

// configDoc is the shape of documents stored in the config collection.
type configDoc struct {
	Key   string `bson:"key"`
	Value Target `bson:"value"`
}

// TargetStore manages the current target with an in-memory cache backed by MongoDB.
type TargetStore struct {
	mu      sync.RWMutex
	cached  *Target
	hasLoad bool // whether we have attempted a DB load
	col     *mongo.Collection
}

// NewTargetStore connects to MongoDB and returns a TargetStore.
func NewTargetStore(mongoURI string) *TargetStore {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	col := client.Database("boller-bot").Collection("config")
	return &TargetStore{col: col}
}

// Get returns the current target, loading from DB on first call.
func (s *TargetStore) Get(ctx context.Context) (*Target, error) {
	s.mu.RLock()
	if s.hasLoad {
		t := s.cached
		s.mu.RUnlock()
		return t, nil
	}
	s.mu.RUnlock()

	// Upgrade to write lock for the DB load
	s.mu.Lock()
	defer s.mu.Unlock()

	// Double-check after acquiring write lock
	if s.hasLoad {
		return s.cached, nil
	}

	var doc configDoc
	err := s.col.FindOne(ctx, bson.M{"key": targetKey}).Decode(&doc)
	s.hasLoad = true

	if err == mongo.ErrNoDocuments {
		s.cached = nil
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	t := doc.Value
	s.cached = &t
	return s.cached, nil
}

// Set upserts a target into MongoDB and updates the cache.
func (s *TargetStore) Set(ctx context.Context, target Target) error {
	_, err := s.col.UpdateOne(
		ctx,
		bson.M{"key": targetKey},
		bson.M{"$set": bson.M{"key": targetKey, "value": target}},
		options.UpdateOne().SetUpsert(true),
	)
	if err != nil {
		return err
	}

	s.mu.Lock()
	s.cached = &target
	s.hasLoad = true
	s.mu.Unlock()
	return nil
}

// Reset removes the target from MongoDB and clears the cache.
func (s *TargetStore) Reset(ctx context.Context) error {
	_, err := s.col.DeleteOne(ctx, bson.M{"key": targetKey})
	if err != nil {
		return err
	}

	s.mu.Lock()
	s.cached = nil
	s.hasLoad = true
	s.mu.Unlock()
	return nil
}
